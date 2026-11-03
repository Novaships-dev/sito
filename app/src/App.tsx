// La coquille de l'app : connexion, navigation, file d'envoi.
// Adresses en #/… : l'app se sert depuis n'importe quel dossier, sans réglage serveur.
import { useEffect, useMemo, useState } from 'react';
import { Ctx, useApp, type Contexte } from './ui';
import { creerFile, type Etat } from './attente';
import type { Donnees } from './types';
import { Connexion } from './ecrans/Connexion';
import { Inscription } from './ecrans/Inscription';
import { Accueil } from './ecrans/Accueil';
import { Chantiers, Chantier } from './ecrans/Chantiers';
import { MonSite } from './ecrans/MonSite';
import { Adresse } from './ecrans/Adresse';
import { Avis } from './ecrans/Avis';
import { Google } from './ecrans/Google';
import { Abonnement } from './ecrans/Abonnement';
import { Compte } from './ecrans/Compte';
import { Installer } from './ecrans/Installer';

function useRoute(): string[] {
  const lire = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [r, setR] = useState(lire);
  useEffect(() => {
    const f = () => { setR(lire()); window.scrollTo(0, 0); document.getElementById('contenu')?.focus({ preventScroll: true }); };
    addEventListener('hashchange', f);
    // L'adresse a pu changer entre le premier rendu et cet abonnement (WebKit
    // pose le « #/inscription/… » après le chargement : le lien d'inscription
    // ouvrait la connexion, T49, 3 nov. 2026). On la relit une fois.
    setR(lire());
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}

const ONGLETS = [
  { lien: '', texte: 'Accueil', icone: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { lien: 'chantiers', texte: 'Chantiers', icone: 'M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { lien: 'site', texte: 'Mon site', icone: 'M3 5h18v14H3zM3 9h18' },
  { lien: 'avis', texte: 'Avis', icone: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z' },
  { lien: 'plus', texte: 'Plus', icone: 'M5 12h.01M12 12h.01M19 12h.01' },
];
const PLUS = [
  { lien: 'adresse', texte: 'Mon adresse' },
  { lien: 'google', texte: 'Ma fiche Google' },
  { lien: 'abonnement', texte: 'Abonnement' },
  { lien: 'compte', texte: 'Compte et mentions légales' },
  { lien: 'installer', texte: 'Installer l’app' },
];

export function App({ donnees, android }: { donnees: Donnees; android: boolean }) {
  const file = useMemo(() => creerFile(donnees), [donnees]);
  const ctx: Contexte = useMemo(() => ({ donnees, file, android }), [donnees, file, android]);
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
  else if (!connecte && (route[0] === 'inscription' || route[0] === 'reprise') && route[1]) page = <Inscription key={route[1]} jeton={decodeURIComponent(route[1])} />;
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
    // un lien d'inscription rouvert une fois connecté : rien à faire, l'accueil
    case '': case 'inscription': case 'reprise': return <Accueil />;
    case 'chantiers': return route[1] ? <Chantier id={decodeURIComponent(route[1])} /> : <Chantiers />;
    case 'site': return <MonSite />;
    case 'adresse': return <Adresse />;
    case 'avis': return <Avis />;
    case 'google': return <Google />;
    case 'abonnement': return <Abonnement />;
    case 'compte': return <Compte />;
    case 'plus': return <Plus />;
    default: return <main className="ecran" id="contenu" tabIndex={-1}><h1>Page introuvable</h1><a href="#/">Retour à l’accueil</a></main>;
  }
}

function Plus() {
  useEffect(() => { document.title = 'Plus, Sitô'; }, []);
  return (
    <main className="ecran" id="contenu" tabIndex={-1}>
      <h1>Plus</h1>
      <ul className="liste">{PLUS.map((p) => <li key={p.lien}><a className="carte lien-carte" href={`#/${p.lien}`}>{p.texte}</a></li>)}</ul>
    </main>
  );
}

function Navigation({ actif }: { actif: string }) {
  const dansPlus = PLUS.some((p) => p.lien === actif);
  return (
    <nav className="navigation" aria-label="Navigation principale">
      <ul>
        {ONGLETS.map((o) => {
          const courant = o.lien === actif || (o.lien === 'plus' && dansPlus);
          return (
            <li key={o.lien} className={o.lien === 'plus' ? 'seulement-telephone' : ''}>
              <a href={`#/${o.lien}`} aria-current={courant ? 'page' : undefined}>
                <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24"><path d={o.icone} /></svg>
                <span>{o.texte}</span>
              </a>
            </li>
          );
        })}
        {PLUS.map((p) => (
          <li key={p.lien} className="seulement-ordinateur">
            <a href={`#/${p.lien}`} aria-current={p.lien === actif ? 'page' : undefined}><span>{p.texte}</span></a>
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
