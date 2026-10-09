// Mes chantiers : créer un chantier, ajouter des paires avant / après et d'autres
// photos ou vidéos. Tout format accepté (décision du 3 octobre).
import { useEffect, useId, useState } from 'react';
import { useApp, useCharge, Chargement, Ecran, useAction, Message, Pastille } from '../ui';
import { dateLisible } from '../jour';
import { preparer, nomEnvoye } from '../photo';
import type { Photo, RolePhoto } from '../types';

// iPhone : image/* laisse passer HEIC et ProRAW (DNG) tels quels. Les extensions
// listées servent aux ordinateurs et aux Android qui filtrent par nom.
const ACCEPTE = 'image/*,video/*,.heic,.heif,.avif,.dng,.raw,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.pef,.srw,.tif,.tiff,.mov,.mp4,.m4v,.3gp,.webm';

export function Chantiers() {
  const { donnees } = useApp();
  const liste = useCharge((d) => d.chantiers());
  const [titre, setTitre] = useState('');
  const [commune, setCommune] = useState('');
  const a = useAction();

  return (
    <Ecran titre="Mes chantiers">
      <form className="carte" onSubmit={async (e) => {
        e.preventDefault();
        let id = '';
        if (await a.lancer(async () => { id = (await donnees.creerChantier({ titre: titre.trim(), commune: commune.trim() || null })).id; })) {
          setTitre(''); setCommune(''); location.hash = `#/chantiers/${id}`;
        }
      }}>
        <h2>Nouveau chantier</h2>
        <label htmlFor="ch-titre">Ce qui a été fait</label>
        <p className="aide" id="aide-ch-titre">Par exemple : ravalement d’une maison de ville.</p>
        <input id="ch-titre" required maxLength={140} aria-describedby="aide-ch-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
        <label htmlFor="ch-commune">Commune</label>
        <input id="ch-commune" maxLength={80} autoComplete="address-level2" value={commune} onChange={(e) => setCommune(e.target.value)} />
        <Message erreur={a.erreur} />
        <button className="bouton" disabled={a.occupe}>Créer et ajouter des photos</button>
      </form>

      <Chargement {...liste} />
      {liste.valeur && liste.valeur.length === 0 && <p className="discret">Aucun chantier pour l’instant.</p>}
      <ul className="liste">
        {(liste.valeur || []).map((c) => (
          <li key={c.id}>
            <a className="carte lien-carte" href={`#/chantiers/${c.id}`}>
              <strong>{c.titre || 'Chantier sans titre'}</strong>
              <span className="discret">{[c.commune, dateLisible(c.cree_le)].filter(Boolean).join(', ')}</span>
              <Pastille ton={c.publie ? 'ok' : 'neutre'}>{c.publie ? 'Sur le site' : 'Pas encore sur le site'}</Pastille>
            </a>
          </li>
        ))}
      </ul>
    </Ecran>
  );
}

export function Chantier({ id }: { id: string }) {
  const { file } = useApp();
  const chantier = useCharge(async (d) => (await d.chantiers()).find((c) => c.id === id) || null, [id]);
  const photos = useCharge((d) => d.photos(id), [id]);
  useEffect(() => file.surEnvoiFini((cid) => { if (cid === id) void photos.recharger(); }), [file, id, photos.recharger]);
  // Ce qui attend encore d'être envoyé : la case est prise, on ne la propose plus.
  const [enFile, setEnFile] = useState<{ role: RolePhoto; paire: number | null; nom: string }[]>([]);
  useEffect(() => file.ecouter(() => { void file.enAttente().then((l) => setEnFile(l.filter((e) => e.chantierId === id && e.genre !== 'original'))); }), [file, id]);

  const liste = photos.valeur || [];
  const paires = new Map<number, { avant?: Photo; apres?: Photo }>();
  for (const p of liste) if (p.paire && (p.role === 'avant' || p.role === 'apres')) paires.set(p.paire, { ...paires.get(p.paire), [p.role]: p });
  const attente = new Set(enFile.filter((e) => e.paire).map((e) => `${e.paire}-${e.role}`));
  for (const e of enFile) if (e.paire && !paires.has(e.paire)) paires.set(e.paire, {});
  const prochaine = Math.max(0, ...paires.keys()) + 1;
  const autresEnFile = enFile.filter((e) => !e.paire).length;
  const autres = liste.filter((p) => p.role !== 'avant' && p.role !== 'apres');

  if (!chantier.charge && !chantier.erreur && !chantier.valeur) return <Ecran titre="Chantier introuvable" retour={{ lien: '#/chantiers', texte: 'Mes chantiers' }}><p>Ce chantier n’existe pas ou plus.</p></Ecran>;

  return (
    <Ecran titre={chantier.valeur?.titre || 'Chantier'} retour={{ lien: '#/chantiers', texte: 'Mes chantiers' }}>
      <Chargement {...chantier} />
      <Chargement {...photos} />

      <section aria-labelledby="t-paires">
        <h2 id="t-paires">Avant / après</h2>
        <p className="aide">Même endroit, même cadrage si possible. Le site les montre côte à côte.</p>
        {[...paires.entries()].sort((a, b) => a[0] - b[0]).map(([n, p]) => (
          <div className="paire" key={n}>
            <Case chantierId={id} role="avant" paire={n} photo={p.avant} enFile={attente.has(`${n}-avant`)} />
            <Case chantierId={id} role="apres" paire={n} photo={p.apres} enFile={attente.has(`${n}-apres`)} />
          </div>
        ))}
        <div className="paire" key={`nouvelle-${prochaine}`}>
          <Case chantierId={id} role="avant" paire={prochaine} />
          <Case chantierId={id} role="apres" paire={prochaine} />
        </div>
      </section>

      <section aria-labelledby="t-autres">
        <h2 id="t-autres">Autres photos et vidéos</h2>
        <p className="aide">Le chantier en cours, un geste, un détail. Les vidéos sont gardées pour plus tard.</p>
        <div className="galerie">{autres.map((p) => <Vignette key={p.id} photo={p} />)}</div>
        {autresEnFile > 0 && <p className="discret" role="status">{autresEnFile} en attente d’envoi.</p>}
        <Choix chantierId={id} role="chantier" paire={null} plusieurs libelle="Ajouter des photos ou vidéos" />
      </section>
    </Ecran>
  );
}

function Case({ chantierId, role, paire, photo, enFile }: { chantierId: string; role: 'avant' | 'apres'; paire: number; photo?: Photo; enFile?: boolean }) {
  const libelle = role === 'avant' ? 'Avant' : 'Après';
  return (
    <div className="case">
      <p className="role">{libelle}</p>
      {photo ? <Vignette photo={photo} /> : enFile ? <div className="sans-apercu"><Pastille ton="attente">En attente d’envoi</Pastille></div> : <Choix chantierId={chantierId} role={role} paire={paire} libelle={`Photo ${libelle.toLowerCase()}`} />}
    </div>
  );
}

function Vignette({ photo }: { photo: Photo }) {
  return (
    <figure className="vignette">
      {photo.apercu ? <img src={photo.apercu} alt={`Photo ${photo.role}`} loading="lazy" /> : <div className="sans-apercu" aria-hidden="true">{(photo.format_origine || '').toUpperCase()}</div>}
      <figcaption>
        {photo.etat === 'prete' && <Pastille ton="ok">Prête</Pastille>}
        {photo.etat === 'recue' && <Pastille ton="attente">Reçue, en préparation</Pastille>}
        {photo.etat === 'illisible' && <Pastille ton="probleme">Illisible{photo.motif ? ` : ${photo.motif}` : ''}</Pastille>}
      </figcaption>
    </figure>
  );
}

function Choix({ chantierId, role, paire, libelle, plusieurs }: { chantierId: string; role: RolePhoto; paire: number | null; libelle: string; plusieurs?: boolean }) {
  const { file } = useApp();
  const champ = useId();
  const [occupe, setOccupe] = useState(false);
  const [refus, setRefus] = useState<string[]>([]);
  const [ajoutes, setAjoutes] = useState(0);

  async function choisir(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setOccupe(true); setRefus([]); setAjoutes(0);
    const refuses: string[] = [];
    let n = 0;
    for (const f of [...fichiers]) {
      const p = await preparer(f);
      if (p.genre === 'refuse') { refuses.push(`${f.name} : ${p.raison}`); continue; }
      const cle = crypto.randomUUID();
      // Une vidéo choisie dans une case avant/après ne prend pas la place de la photo.
      if (p.genre === 'video') await file.ajouter({ genre: 'video', fichier: p.fichier, nom: f.name, format: p.format, role: 'chantier', paire: null, chantierId, cle });
      else {
        const reduite = { genre: 'photo' as const, fichier: p.fichier, nom: nomEnvoye(f.name, p), format: p.format, role, paire, chantierId, cle };
        // Décision du 9 octobre : l'original en pleine résolution suit la version réduite.
        if (p.original) await file.ajouter(reduite, { genre: 'original', fichier: p.original, nom: f.name, format: p.format, role, paire, chantierId, cle });
        else await file.ajouter(reduite);
      }
      n++;
    }
    setRefus(refuses); setAjoutes(n); setOccupe(false);
  }

  return (
    <div className="choix">
      <label className="bouton secondaire" htmlFor={champ} aria-busy={occupe}>{occupe ? 'Préparation…' : libelle}</label>
      <input id={champ} className="invisible" type="file" accept={ACCEPTE} multiple={plusieurs}
        onChange={(e) => { void choisir(e.target.files); e.target.value = ''; }} />
      {ajoutes > 0 && <p className="succes" role="status">{ajoutes > 1 ? `${ajoutes} fichiers ajoutés` : 'Fichier ajouté'} à l’envoi.</p>}
      {refus.map((r) => <p className="erreur" role="alert" key={r}>{r}</p>)}
    </div>
  );
}
