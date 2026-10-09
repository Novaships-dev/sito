// La file d'envoi. Une photo prise sur un chantier sans réseau ne doit pas se
// perdre : le fichier préparé est gardé dans l'appareil (IndexedDB) jusqu'à
// ce que l'envoi soit terminé, et repart à la prochaine ouverture de l'app.
// L'envoi lui-même reprend où il s'était arrêté (protocole TUS, morceaux de 6 Mo).
import type { Donnees, RolePhoto } from './types';

// genre 'original' : le fichier d'origine d'une photo réduite déjà dans la
// file (même cle) ; il part après elle, la file étant traitée dans l'ordre.
export type Element = {
  id: string; genre: 'photo' | 'video' | 'original'; fichier: Blob; nom: string; format: string;
  role: RolePhoto; paire: number | null; chantierId: string; cle: string; ajoute: number;
};
export type Etat = { attente: number; enCours: { nom: string; part: number } | null; erreur: string | null };

const TABLE = 'file';

function ouvrir(BASE: string): Promise<IDBDatabase | null> {
  return new Promise((ok) => {
    try {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(TABLE, { keyPath: 'id' });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    } catch { ok(null); }
  });
}

function operation<T>(db: IDBDatabase, mode: IDBTransactionMode, faire: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((ok, ko) => {
    const r = faire(db.transaction(TABLE, mode).objectStore(TABLE));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

export function creerFile(donnees: Donnees) {
  // Sans IndexedDB (navigation privée ancienne), la file reste en mémoire.
  const memoire = new Map<string, Element>();
  // La démonstration a sa propre file : rien ne passe d'un mode à l'autre.
  const dbPromesse = ouvrir(donnees.demo ? 'sito-envois-demo' : 'sito-envois');
  const ecouteurs = new Set<(e: Etat) => void>();
  const finis = new Set<(chantierId: string) => void>();
  let etat: Etat = { attente: 0, enCours: null, erreur: null };
  let actif = false;

  const publier = (e: Partial<Etat>) => { etat = { ...etat, ...e }; ecouteurs.forEach((f) => f(etat)); };

  async function tous(): Promise<Element[]> {
    const db = await dbPromesse;
    const liste = db ? await operation(db, 'readonly', (t) => t.getAll() as IDBRequest<Element[]>).catch(() => [...memoire.values()]) : [...memoire.values()];
    return liste.sort((a, b) => a.ajoute - b.ajoute);
  }
  async function poser(e: Element) {
    const db = await dbPromesse;
    if (db) { try { await operation(db, 'readwrite', (t) => t.put(e)); return; } catch { /* quota plein : mémoire */ } }
    memoire.set(e.id, e);
  }
  async function retirer(id: string) {
    memoire.delete(id);
    const db = await dbPromesse;
    if (db) await operation(db, 'readwrite', (t) => t.delete(id)).catch(() => undefined);
  }

  async function traiter() {
    if (actif) return;
    actif = true;
    try {
      for (;;) {
        const liste = await tous();
        publier({ attente: liste.length });
        const e = liste[0];
        if (!e) break;
        if (!navigator.onLine) { publier({ enCours: null, erreur: 'Pas de réseau : l’envoi reprendra tout seul.' }); break; }
        const nom = e.genre === 'original' ? `${e.nom} (original)` : e.nom;
        publier({ enCours: { nom, part: 0 }, erreur: null });
        const progression = (part: number) => publier({ enCours: { nom, part } });
        try {
          if (e.genre === 'video') await donnees.envoyerVideo({ fichier: e.fichier, nom: e.nom, format: e.format, chantierId: e.chantierId }, progression);
          else if (e.genre === 'original') await donnees.envoyerOriginal({ fichier: e.fichier, nom: e.nom, format: e.format, chantierId: e.chantierId, cle: e.cle }, progression);
          else await donnees.envoyerPhoto({ fichier: e.fichier, nom: e.nom, format: e.format, role: e.role, paire: e.paire, chantierId: e.chantierId, cle: e.cle }, progression);
          await retirer(e.id);
          finis.forEach((f) => f(e.chantierId));
        } catch (err) {
          publier({ enCours: null, erreur: `Envoi interrompu : ${(err as Error).message}. Il reprendra tout seul.` });
          break;
        }
      }
    } finally {
      actif = false;
      publier({ enCours: null, attente: (await tous()).length });
    }
  }

  addEventListener('online', () => void traiter());

  return {
    etat: () => etat,
    ecouter(f: (e: Etat) => void) { ecouteurs.add(f); f(etat); return () => { ecouteurs.delete(f); }; },
    surEnvoiFini(f: (chantierId: string) => void) { finis.add(f); return () => { finis.delete(f); }; },
    // Plusieurs éléments d'un coup (photo réduite + original) : posés dans l'ordre.
    async ajouter(...liste: Omit<Element, 'id' | 'ajoute'>[]) {
      let t = Date.now();
      for (const e of liste) await poser({ ...e, id: crypto.randomUUID(), ajoute: t++ });
      void traiter();
    },
    reprendre: () => traiter(),
    enAttente: tous,
  };
}

export type File_ = ReturnType<typeof creerFile>;
