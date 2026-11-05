// Ce que tous les écrans partagent : accès aux données, chargement, messages.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Donnees } from './types';
import type { File_ } from './attente';

export type Contexte = { donnees: Donnees; file: File_ };
export const Ctx = createContext<Contexte | null>(null);
export function useApp(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error('Contexte absent');
  return c;
}

// Charge une donnée, garde l'erreur, permet de recharger.
export function useCharge<T>(lire: (d: Donnees) => Promise<T>, deps: unknown[] = []) {
  const { donnees } = useApp();
  const [valeur, setValeur] = useState<T | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [charge, setCharge] = useState(true);
  const tour = useRef(0);
  const recharger = useCallback(async () => {
    const n = ++tour.current;
    setCharge(true);
    try {
      const v = await lire(donnees);
      if (n === tour.current) { setValeur(v); setErreur(null); }
    } catch (e) {
      if (n === tour.current) setErreur((e as Error).message);
    } finally {
      if (n === tour.current) setCharge(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnees, ...deps]);
  useEffect(() => { void recharger(); }, [recharger]);
  return { valeur, erreur, charge, recharger };
}

// Une action : bouton occupé pendant l'envoi, message d'erreur près du bouton.
export function useAction() {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState<string | null>(null);
  const lancer = useCallback(async (f: () => Promise<unknown>, message?: string) => {
    setOccupe(true); setErreur(null); setFait(null);
    try { await f(); if (message) setFait(message); return true; }
    catch (e) { setErreur((e as Error).message); return false; }
    finally { setOccupe(false); }
  }, []);
  return { occupe, erreur, fait, lancer, effacer: () => { setErreur(null); setFait(null); } };
}

export function Chargement({ erreur, charge, recharger }: { erreur: string | null; charge: boolean; recharger?: () => void }) {
  if (erreur) return (
    <div className="alerte" role="alert">
      <p>{erreur}</p>
      {recharger && <button className="bouton secondaire" onClick={recharger}>Réessayer</button>}
    </div>
  );
  if (charge) return <p className="discret" aria-live="polite">Chargement…</p>;
  return null;
}

export function Message({ erreur, fait }: { erreur: string | null; fait?: string | null }) {
  if (erreur) return <p className="erreur" role="alert">{erreur}</p>;
  if (fait) return <p className="succes" role="status">{fait}</p>;
  return null;
}

export function Ecran({ titre, children, retour }: { titre: string; children: ReactNode; retour?: { lien: string; texte: string } }) {
  useEffect(() => { document.title = `${titre}, MonSiteArtisan`; }, [titre]);
  return (
    <main className="ecran" id="contenu" tabIndex={-1}>
      {retour && <a className="retour" href={retour.lien}>← {retour.texte}</a>}
      <h1>{titre}</h1>
      {children}
    </main>
  );
}

export function Pastille({ ton, children }: { ton: 'ok' | 'attente' | 'probleme' | 'neutre'; children: ReactNode }) {
  // La couleur ne porte jamais le sens seule : le texte dit l'état.
  return <span className={`pastille ${ton}`}>{children}</span>;
}

export const euros = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const telephoneLisible = (t: string | null) => (t ? t.replace(/(\d{2})(?=\d)/g, '$1 ') : '');
