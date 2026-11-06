// La coquille de l'app : connexion, navigation, file d'envoi.
// Adresses en #/… : l'app se sert depuis n'importe quel dossier, sans réglage serveur.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Ctx, useApp, type Contexte } from './ui';
import { creerFile, type Etat } from './attente';
import type { Donnees } from './types';
import { Connexion } from './ecrans/Connexion';
import { Chantiers, Chantier } from './ecrans/Chantiers';
import { Compte } from './ecrans/Compte';
import { Installer, estInstallee } from './ecrans/Installer';

// La page de MonSiteArtisan (offre, maquette, WhatsApp) : chargée à part, l'espace
// artisan n'en porte pas le poids. Sur l'écran d'accueil (app installée),
// on va droit à la connexion.
const Vitrine = lazy(() => import('./vitrine/Vitrine'));

function useRoute(): string[] {
  // Ce qui suit « ? » dans le # n'est pas une route : l'écran le lit lui-même.
  const lire = () => location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  const [r, setR] = useState(lire);
  useEffect(() => {
    const f = () => { setR(lire()); window.scrollTo(0, 0); document.getElementById('contenu')?.focus({ preventScroll: true }); };
    addEventListener('hashchange', f);
    // L'adresse a pu changer entre le premier rendu et cet abonnement (WebKit
    // pose le « # » après le chargement, T49, 3 nov. 2026). On la relit une fois.
    setR(lire());
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}

// Deux onglets (T61, décision du 5 nov. 2026 : « le reste sa sers a rien ») :
// les chantiers, où partent les photos, et le compte.
const ONGLETS = [
  { lien: 'chantiers', texte: 'Mes chantiers', icone: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { lien: 'compte', texte: 'Mon compte', icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0' },
];

export function App({ donnees }: { donnees: Donnees }) {
  const file = useMemo(() => creerFile(donnees), [donnees]);
  const ctx: Contexte = useMemo(() => ({ donnees, file }), [donnees, file]);
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const route = useRoute();

  useEffect(() => {
    const verifier = () => void donnees.utilisateur().then((u) => setConnecte(!!u)).catch(() => setConnecte(false));
    verifier();
    return donnees.surChangementSession(verifier);
  }, [donnees]);
  useEffect(() => { if (connecte) void file.reprendre(); }, [connecte, file]);

  let page;
  if (connecte === null) page = <main className="ecran" id="contenu" tabIndex={-1}><p className="discret">Chargement…</p></main>;
  else if (route[0] === 'installer') page = <Installer />;
  else if (!connecte && !route[0] && !estInstallee()) return <Suspense fallback={null}><Vitrine /></Suspense>;
  else if (!connecte) page = <Connexion />;
  else page = <Page route={route} />;

  return (
    <Ctx.Provider value={ctx}>
      <a className="aller-contenu" href="#contenu" onClick={(e) => { e.preventDefault(); document.getElementById('contenu')?.focus(); }}>Aller au contenu</a>
      {donnees.demo && connecte && <p className="bandeau-demo">Démonstration : rien n’est envoyé, rien n’est publié.</p>}
      {connecte && <Envois />}
      <div className={connecte ? 'cadre' : ''}>
        {connecte && <Navigation actif={route[0] || ''} />}
        {page}
      </div>
    </Ctx.Provider>
  );
}

function Page({ route }: { route: string[] }) {
  switch (route[0] || '') {
    // une fois connecté, l'artisan arrive sur ses chantiers
    case '': case 'connexion': case 'chantiers': return route[1] ? <Chantier id={decodeURIComponent(route[1])} /> : <Chantiers />;
    case 'compte': return <Compte />;
    default: return <main className="ecran" id="contenu" tabIndex={-1}><h1>Page introuvable</h1><a href="#/chantiers">Retour à mes chantiers</a></main>;
  }
}

function Navigation({ actif }: { actif: string }) {
  const courant = actif === 'compte' ? 'compte' : 'chantiers';
  return (
    <nav className="navigation" aria-label="Navigation principale">
      <ul>
        {ONGLETS.map((o) => (
          <li key={o.lien}>
            <a href={`#/${o.lien}`} aria-current={o.lien === courant ? 'page' : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24"><path d={o.icone} /></svg>
              <span>{o.texte}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Envois() {
  const { file } = useApp();
  const [e, setE] = useState<Etat>(file.etat());
  useEffect(() => file.ecouter(setE), [file]);
  if (!e.attente && !e.erreur) return null;
  return (
    <div className="envois" role="status" aria-live="polite">
      {e.enCours ? (
        <>
          <span>Envoi de {e.enCours.nom}{e.attente > 1 ? ` (+${e.attente - 1})` : ''}</span>
          <progress max={1} value={e.enCours.part} aria-label="Progression de l’envoi" />
        </>
      ) : e.attente ? <span>{e.attente} envoi{e.attente > 1 ? 's' : ''} en attente</span> : null}
      {e.erreur && <span className="envois-erreur">{e.erreur} <button className="lien" onClick={() => void file.reprendre()}>Réessayer</button></span>}
    </div>
  );
}
