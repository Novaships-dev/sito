// Mon adresse : les trois cas du plan (section 4.1, APPFLOW §3.6).
//   A. adresse offerte, par défaut ;
//   B. « Je veux mon domaine » : cherché, puis réservé au nom de l'artisan chez
//      Gandi, compris dans l'abonnement (abonnement en cours, .fr ou .com) ;
//   C. « J'ai déjà un domaine » : l'artisan ajoute un CNAME `www` chez son
//      registrar ; l'app lui donne la valeur et vérifie.
// B et C passent par le service des domaines (T20, fonction Edge `domaines`).
import { useState } from 'react';
import { useApp, useAction, useCharge, Chargement, Ecran, Message, Pastille } from '../ui';
import type { Adresse as A, Branchement, RechercheDomaine } from '../types';

const ETATS: Record<A['etat'], { texte: string; ton: 'ok' | 'attente' | 'probleme' | 'neutre' }> = {
  active: { texte: 'Active', ton: 'ok' },
  en_attente: { texte: 'En cours de mise en place', ton: 'attente' },
  echec: { texte: 'Problème', ton: 'probleme' },
  retiree: { texte: 'Retirée', ton: 'neutre' },
};
const GENRES: Record<A['genre'], string> = { offerte: 'Adresse offerte', achetee: 'Mon domaine', existante: 'Mon domaine existant' };

export function Adresse() {
  const { donnees } = useApp();
  const adresses = useCharge((d) => d.adresses());
  const verif = useAction();
  const enAttente = (adresses.valeur || []).filter((a) => a.genre !== 'offerte' && a.etat === 'en_attente');
  return (
    <Ecran titre="Mon adresse">
      <Chargement {...adresses} />
      {adresses.valeur && adresses.valeur.length === 0 && <p>Votre adresse sera créée avec votre site.</p>}
      <ul className="liste">
        {(adresses.valeur || []).map((a) => (
          <li className="carte" key={a.hote}>
            <p className="entete-carte"><strong className="hote">{a.hote}</strong>{a.principale && <span className="discret">adresse principale</span>}</p>
            <p>{GENRES[a.genre]}, <Pastille ton={ETATS[a.etat].ton}>{ETATS[a.etat].texte}</Pastille></p>
            {a.motif && <p className="erreur">{a.motif}</p>}
            {a.etat === 'active' && <a className="bouton secondaire" href={`https://${a.hote}`} target="_blank" rel="noopener">Ouvrir</a>}
            {a.genre !== 'offerte' && a.etat === 'en_attente' && (
              <button className="bouton secondaire" disabled={verif.occupe}
                onClick={async () => { if (await verif.lancer(() => donnees.verifierDomaine(a.hote))) void adresses.recharger(); }}>
                Vérifier maintenant
              </button>
            )}
          </li>
        ))}
      </ul>
      {enAttente.length > 0 && <Message erreur={verif.erreur} />}

      <MonDomaine apres={() => void adresses.recharger()} />
      <DomaineExistant apres={() => void adresses.recharger()} />
    </Ecran>
  );
}

// Cas B : chercher, puis réserver. Aucun prix : le domaine est compris dans
// l'abonnement.
function MonDomaine({ apres }: { apres: () => void }) {
  const { donnees } = useApp();
  const abonnement = useCharge((d) => d.abonnement());
  const profil = useCharge((d) => d.profil());
  const entreprise = useCharge((d) => d.entreprise());
  const [nom, setNom] = useState('');
  const [trouve, setTrouve] = useState<RechercheDomaine | null>(null);
  const [rep, setRep] = useState<{ prenom: string; nom: string } | null>(null);
  const cherche = useAction();
  const reserve = useAction();
  const enCours = abonnement.valeur?.etat === 'actif';

  // Le représentant, prérempli depuis « Directeur de la publication » : le
  // premier mot pour le prénom, le reste pour le nom ; l'artisan corrige.
  const representant = rep ?? (() => {
    const mots = (profil.valeur?.directeur_publication || '').trim().split(/\s+/).filter(Boolean);
    return { prenom: mots[0] || '', nom: mots.slice(1).join(' ') };
  })();

  return (
    <section className="carte" aria-labelledby="t-domaine">
      <h2 id="t-domaine">Je veux mon propre nom de domaine</h2>
      <p>Par exemple <span className="hote">facades-martin.fr</span>. Il est compris dans l’abonnement, enregistré <strong>à votre nom</strong> : il vous appartient, même si vous quittez Sitô.</p>
      <form onSubmit={async (e) => {
        e.preventDefault(); setTrouve(null); reserve.effacer();
        await cherche.lancer(async () => setTrouve(await donnees.chercherDomaine(nom)));
      }}>
        <label htmlFor="nom-domaine">Le nom voulu</label>
        <p className="aide" id="aide-nom-domaine">En .fr ou en .com, lettres sans accent, chiffres et tirets.</p>
        <input id="nom-domaine" value={nom} onChange={(e) => { setNom(e.target.value); setTrouve(null); }}
          aria-describedby="aide-nom-domaine" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="facades-martin.fr" />
        <button className="bouton secondaire" disabled={cherche.occupe || !nom.trim()}>Vérifier s’il est libre</button>
      </form>
      <Message erreur={cherche.erreur} />
      {trouve && !trouve.disponible && <p className="erreur" role="status"><span className="hote">{trouve.hote}</span> : {trouve.motif}</p>}
      {trouve && trouve.disponible && (
        <div role="status">
          <p className="succes"><span className="hote">{trouve.hote}</span> est libre.</p>
          {!enCours && <p className="aide">Il pourra être réservé à votre nom une fois votre abonnement en cours{' (écran Abonnement).'}</p>}
          {enCours && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (await reserve.lancer(() => donnees.acheterDomaine(trouve.hote, representant),
                `C’est fait : ${trouve.hote} est réservé à votre nom. Il sera en ligne d’ici quelques heures.`)) { setTrouve(null); setNom(''); apres(); }
            }}>
              <p>Il sera enregistré au nom de <strong>{entreprise.valeur?.nom_affiche || 'votre entreprise'}</strong>, représentée par :</p>
              <label htmlFor="rep-prenom">Prénom</label>
              <input id="rep-prenom" value={representant.prenom} autoComplete="given-name" onChange={(e) => setRep({ ...representant, prenom: e.target.value })} />
              <label htmlFor="rep-nom">Nom</label>
              <input id="rep-nom" value={representant.nom} autoComplete="family-name" onChange={(e) => setRep({ ...representant, nom: e.target.value })} />
              <button className="bouton" disabled={reserve.occupe || !representant.prenom.trim() || !representant.nom.trim()}>Réserver {trouve.hote}</button>
            </form>
          )}
        </div>
      )}
      <Message erreur={reserve.erreur} fait={reserve.fait} />
    </section>
  );
}

// Cas C : brancher son domaine, avec le CNAME à poser chez son hébergeur.
function DomaineExistant({ apres }: { apres: () => void }) {
  const { donnees } = useApp();
  const [nom, setNom] = useState('');
  const [b, setB] = useState<Branchement | null>(null);
  const a = useAction();
  return (
    <section className="carte" aria-labelledby="t-existant">
      <h2 id="t-existant">J’ai déjà un nom de domaine</h2>
      <p>Vous le gardez chez votre hébergeur actuel. Il faudra y ajouter une ligne, un enregistrement « CNAME » sur <span className="hote">www</span> : l’app vous donne la valeur exacte et vérifie pour vous que c’est bon.</p>
      {!b && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          await a.lancer(async () => { setB(await donnees.brancherDomaine(nom)); apres(); });
        }}>
          <label htmlFor="nom-existant">Votre nom de domaine</label>
          <input id="nom-existant" value={nom} onChange={(e) => setNom(e.target.value)} inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="facades-martin.fr" />
          <button className="bouton secondaire" disabled={a.occupe || !nom.trim()}>Brancher mon domaine</button>
        </form>
      )}
      <Message erreur={a.erreur} />
      {b && (
        <div role="status">
          <p>Chez votre hébergeur (là où vous payez le nom de domaine), dans la zone DNS de <span className="hote">{b.adresse.hote.replace(/^www\./, '')}</span>, ajoutez :</p>
          <table className="dns">
            <tbody>
              <tr><th scope="row">Type</th><td>CNAME</td></tr>
              <tr><th scope="row">Nom</th><td className="hote">{b.cname.nom}</td></tr>
              <tr><th scope="row">Valeur</th><td className="hote">{b.cname.valeur}</td></tr>
            </tbody>
          </table>
          <p className="aide">Supprimez d’abord un ancien enregistrement sur <span className="hote">www</span> s’il y en a un. La prise en compte prend de quelques minutes à quelques heures ; ensuite, touchez « Vérifier maintenant » sur l’adresse ci-dessus. Pour que l’adresse sans www arrive aussi sur votre site, demandez à votre hébergeur une redirection vers <span className="hote">{b.adresse.hote}</span>.</p>
        </div>
      )}
    </section>
  );
}
