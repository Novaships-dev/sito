// Ma fiche Google : l'état de la connexion. L'app marche sans Google (plan, 6.4) :
// tant que l'accès n'est pas accordé, un lien direct vers la fiche.
import { useCharge, Chargement, Ecran, Pastille } from '../ui';
import { dateLisible } from '../jour';

const ETATS = {
  a_connecter: { texte: 'Pas encore reliée', ton: 'neutre' },
  connectee: { texte: 'Reliée', ton: 'ok' },
  revoquee: { texte: 'Accès retiré', ton: 'probleme' },
  erreur: { texte: 'Problème', ton: 'probleme' },
} as const;

export function Google() {
  const c = useCharge((d) => d.connexionGoogle());
  const etat = c.valeur ? ETATS[c.valeur.etat] : ETATS.a_connecter;
  return (
    <Ecran titre="Ma fiche Google">
      <Chargement {...c} />
      {!c.charge && !c.erreur && (
        <section className="carte">
          <p><Pastille ton={etat.ton}>{etat.texte}</Pastille></p>
          {c.valeur?.fiche && <p>Fiche : <strong>{c.valeur.fiche}</strong></p>}
          {c.valeur?.derniere_synchro && <p className="discret">Dernière mise à jour : {dateLisible(c.valeur.derniere_synchro)}</p>}
          {c.valeur?.motif && <p className="erreur">{c.valeur.motif}</p>}
          {c.valeur?.etat !== 'connectee' && (
            <>
              <p>Une fois votre fiche reliée, Sitô récupère vos avis, vous prépare les réponses et vérifie que la fiche dit la même chose que votre site (nom, adresse, téléphone).</p>
              <p className="aide">La liaison avec Google arrive bientôt. En attendant, vous pouvez gérer votre fiche directement chez Google.</p>
            </>
          )}
          <a className="bouton secondaire" href="https://business.google.com/" target="_blank" rel="noopener">Ouvrir ma fiche chez Google</a>
        </section>
      )}
    </Ecran>
  );
}
