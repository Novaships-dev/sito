// Ma fiche Google : l'état de la connexion. L'app marche sans Google (plan, 6.4) :
// tant que l'accès n'est pas accordé, un lien direct vers la fiche.
import { useApp, useAction, useCharge, Chargement, Ecran, Message, Pastille } from '../ui';
import { dateLisible } from '../jour';

const ETATS = {
  a_connecter: { texte: 'Pas encore reliée', ton: 'neutre' },
  connectee: { texte: 'Reliée', ton: 'ok' },
  revoquee: { texte: 'Accès retiré', ton: 'probleme' },
  erreur: { texte: 'Problème', ton: 'probleme' },
} as const;

// « google=ok » ou « google=erreur » au retour de Google (T24), après le #.
function retourGoogle(): string | null {
  return location.hash.includes('?') ? new URLSearchParams(location.hash.split('?')[1]).get('google') : null;
}
const RETOURS: Record<string, { texte: string; erreur: boolean }> = {
  ok: { texte: 'Votre fiche Google est reliée. Vos avis arrivent dans l’app d’ici demain matin.', erreur: false },
  demo: { texte: 'Démonstration : Google vous demanderait ici votre accord, puis la fiche serait reliée.', erreur: false },
  erreur: { texte: 'La liaison n’a pas abouti. Vous pouvez recommencer ; si cela se répète, écrivez-nous.', erreur: true },
};

export function Google() {
  const { donnees } = useApp();
  const c = useCharge((d) => d.connexionGoogle());
  const relier = useAction();
  const retour = RETOURS[retourGoogle() || ''];
  const etat = c.valeur ? ETATS[c.valeur.etat] : ETATS.a_connecter;
  return (
    <Ecran titre="Ma fiche Google">
      {retour && <p className={retour.erreur ? 'erreur' : 'succes'} role="status">{retour.texte}</p>}
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
              <p className="aide">Google vous demandera votre accord pour que Sitô lise vos avis et publie les réponses que vous validez. Rien ne part sans votre validation.</p>
              <button className="bouton" disabled={relier.occupe}
                onClick={() => void relier.lancer(async () => { location.href = await donnees.lienGoogle(); void c.recharger(); })}>
                {c.valeur?.etat === 'revoquee' || c.valeur?.etat === 'erreur' ? 'Relier à nouveau ma fiche Google' : 'Relier ma fiche Google'}
              </button>
              <Message erreur={relier.erreur} />
            </>
          )}
          <a className="bouton secondaire" href="https://business.google.com/" target="_blank" rel="noopener">Ouvrir ma fiche chez Google</a>
        </section>
      )}
    </Ecran>
  );
}
