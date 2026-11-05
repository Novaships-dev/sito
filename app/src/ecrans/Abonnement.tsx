// Abonnement : formule, état, échéance ; payer et gérer sur le web (T17).
// Prix acceptés par Fabrice le 9 octobre : 39 € HT par mois sans engagement, ou
// 390 € HT par an (formule d'engagement).
// Le paiement passe par Stripe (fonction Edge `stripe-session`, T16) : l'écran
// ne fait qu'ouvrir l'adresse rendue ; l'état revient par le webhook.
import { useState } from 'react';
import { useApp, useCharge, Chargement, Ecran, Pastille } from '../ui';
import { dateLisible } from '../jour';

const FORMULES = { mensuel: { nom: 'Mensuel', prix: '39 € HT par mois' }, annuel: { nom: 'Annuel', prix: '390 € HT par an (2 mois offerts)' } };
const ETATS = {
  essai: { texte: 'Période d’essai', ton: 'attente' },
  actif: { texte: 'Actif', ton: 'ok' },
  impaye: { texte: 'Paiement en échec', ton: 'probleme' },
  resilie: { texte: 'Résilié', ton: 'neutre' },
} as const;

// « paiement=ok » au retour de Stripe, dans l'adresse ou après le #.
function retourPaiement(): string | null {
  const dansHash = location.hash.includes('?') ? new URLSearchParams(location.hash.split('?')[1]).get('paiement') : null;
  return new URLSearchParams(location.search).get('paiement') || dansHash;
}
const RETOURS: Record<string, string> = {
  ok: 'Paiement reçu. L’état de votre abonnement se met à jour dans une minute.',
  annule: 'Paiement annulé : rien n’a été débité.',
  'demo-paiement': 'Démonstration : la page de paiement Stripe s’ouvrirait ici.',
  'demo-portail': 'Démonstration : le portail Stripe (carte, factures, résiliation) s’ouvrirait ici.',
};

export function Abonnement() {
  const { donnees } = useApp();
  const ab = useCharge((d) => d.abonnement());
  const a = ab.valeur;
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const retour = retourPaiement();

  async function ouvrir(action: 'paiement' | 'portail', formule?: 'mensuel' | 'annuel') {
    setOccupe(true); setErreur(null);
    try { location.assign(await donnees.ouvrirPaiement(action, formule)); }
    catch (e) { setErreur(e instanceof Error ? e.message : String(e)); }
    finally { setOccupe(false); }
  }
  const enCours = !!a && a.etat !== 'resilie';

  return (
    <Ecran titre="Abonnement">
      {retour && RETOURS[retour] && <p className="carte" role="status">{RETOURS[retour]}</p>}
      <Chargement {...ab} />
      {ab.valeur === null && <p className="carte">Aucun abonnement pour l’instant.</p>}
      {a && (
        <section className="carte">
          <p><Pastille ton={ETATS[a.etat].ton}>{ETATS[a.etat].texte}</Pastille></p>
          <p>Formule <strong>{FORMULES[a.formule].nom.toLowerCase()}</strong><> : {FORMULES[a.formule].prix}</></p>
          {a.fin_periode && <p>{a.etat === 'essai' ? 'Fin de l’essai' : a.resiliation_prevue ? 'Se termine le' : 'Prochaine échéance'} : <strong>{dateLisible(a.fin_periode)}</strong></p>}
          {a.resiliation_prevue && <p className="aide">Résiliation demandée : votre site reste en ligne jusqu’à cette date.</p>}
          {a.etat === 'impaye' && <p className="erreur">Le dernier paiement n’est pas passé.</p>}
        </section>
      )}

      {ab.valeur !== undefined && (
        <section className="carte" aria-labelledby="t-gerer">
          <h2 id="t-gerer">Gérer mon abonnement</h2>
          <ul className="puces">
            <li>{FORMULES.mensuel.nom} : {FORMULES.mensuel.prix}, sans engagement.</li>
            <li>{FORMULES.annuel.nom} : {FORMULES.annuel.prix}.</li>
          </ul>
          {enCours
            ? <button className="bouton" disabled={occupe} onClick={() => ouvrir('portail')}>{occupe ? 'Ouverture…' : 'Carte, factures, formule, résiliation'}</button>
            : <p className="actions">
                <button className="bouton" disabled={occupe} onClick={() => ouvrir('paiement', 'mensuel')}>S’abonner au mois</button>
                <button className="bouton secondaire" disabled={occupe} onClick={() => ouvrir('paiement', 'annuel')}>S’abonner à l’année</button>
              </p>}
          <p className="aide">Paiement sécurisé par Stripe. MonSiteArtisan ne voit jamais votre carte.</p>
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
        </section>
      )}
    </Ecran>
  );
}
