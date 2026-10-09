// Abonnement : formule, état, échéance.
// Prix acceptés par Fabrice le 9 octobre : 39 € HT par mois sans engagement, ou
// 390 € HT par an (formule d'engagement).
// Plus tard, le prix affiché sera lu chez Stripe (plan, 7.6).
// Dans l'app Android (Play Store) : aucun prix, aucun lien d'achat (règle de
// facturation de Google Play). L'abonnement se prend sur le site Sitô.
import { useApp, useCharge, Chargement, Ecran, Pastille } from '../ui';
import { dateLisible } from '../jour';

const FORMULES = { mensuel: { nom: 'Mensuel', prix: '39 € HT par mois' }, annuel: { nom: 'Annuel', prix: '390 € HT par an (2 mois offerts)' } };
const ETATS = {
  essai: { texte: 'Période d’essai', ton: 'attente' },
  actif: { texte: 'Actif', ton: 'ok' },
  impaye: { texte: 'Paiement en échec', ton: 'probleme' },
  resilie: { texte: 'Résilié', ton: 'neutre' },
} as const;

export function Abonnement() {
  const { android } = useApp();
  const ab = useCharge((d) => d.abonnement());
  const a = ab.valeur;

  return (
    <Ecran titre="Abonnement">
      <Chargement {...ab} />
      {ab.valeur === null && <p className="carte">Aucun abonnement pour l’instant.</p>}
      {a && (
        <section className="carte">
          <p><Pastille ton={ETATS[a.etat].ton}>{ETATS[a.etat].texte}</Pastille></p>
          <p>Formule <strong>{FORMULES[a.formule].nom.toLowerCase()}</strong>{!android && <> : {FORMULES[a.formule].prix}</>}</p>
          {a.fin_periode && <p>{a.etat === 'essai' ? 'Fin de l’essai' : a.resiliation_prevue ? 'Se termine le' : 'Prochaine échéance'} : <strong>{dateLisible(a.fin_periode)}</strong></p>}
          {a.resiliation_prevue && <p className="aide">Résiliation demandée : votre site reste en ligne jusqu’à cette date.</p>}
          {a.etat === 'impaye' && <p className="erreur">Le dernier paiement n’est pas passé.</p>}
        </section>
      )}

      {!android && (
        <section className="carte" aria-labelledby="t-gerer">
          <h2 id="t-gerer">Gérer mon abonnement</h2>
          <ul className="puces">
            <li>{FORMULES.mensuel.nom} : {FORMULES.mensuel.prix}, sans engagement.</li>
            <li>{FORMULES.annuel.nom} : {FORMULES.annuel.prix}.</li>
          </ul>
          <p className="aide">Le paiement en ligne (carte, factures, changement de formule, résiliation) arrive bientôt.</p>
        </section>
      )}
    </Ecran>
  );
}
