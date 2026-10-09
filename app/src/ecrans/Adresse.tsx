// Mon adresse : les trois cas du plan (section 4.1).
//   A. adresse offerte, par défaut ;
//   B. « Je veux mon domaine » : acheté au nom de l'artisan chez Gandi, inclus dans l'abonnement ;
//   C. « J'ai déjà un domaine » : l'artisan ajoute un enregistrement chez son registrar.
// B et C passent par le service (Gandi, Cloudflare), pas encore branché : l'écran le dit.
import { useCharge, Chargement, Ecran, Pastille } from '../ui';
import type { Adresse as A } from '../types';

const ETATS: Record<A['etat'], { texte: string; ton: 'ok' | 'attente' | 'probleme' | 'neutre' }> = {
  active: { texte: 'Active', ton: 'ok' },
  en_attente: { texte: 'En cours de mise en place', ton: 'attente' },
  echec: { texte: 'Problème', ton: 'probleme' },
  retiree: { texte: 'Retirée', ton: 'neutre' },
};
const GENRES: Record<A['genre'], string> = { offerte: 'Adresse offerte', achetee: 'Mon domaine', existante: 'Mon domaine existant' };

export function Adresse() {
  const adresses = useCharge((d) => d.adresses());
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
          </li>
        ))}
      </ul>

      <section className="carte" aria-labelledby="t-domaine">
        <h2 id="t-domaine">Je veux mon propre nom de domaine</h2>
        <p>Par exemple <span className="hote">facades-martin.fr</span>. Il est compris dans l’abonnement, enregistré <strong>à votre nom</strong> : il vous appartient, même si vous quittez Sitô.</p>
        <p className="aide">La recherche et l’achat depuis l’app arrivent bientôt. En attendant, écrivez-nous le nom voulu : nous vérifions qu’il est libre et nous le réservons pour vous.</p>
      </section>

      <section className="carte" aria-labelledby="t-existant">
        <h2 id="t-existant">J’ai déjà un nom de domaine</h2>
        <p>Vous le gardez chez votre hébergeur actuel. Il faudra y ajouter une ligne (un enregistrement « CNAME » sur <span className="hote">www</span>) : l’app vous donnera la valeur exacte et vérifiera pour vous que c’est bon.</p>
        <p className="aide">Cette étape guidée arrive bientôt.</p>
      </section>
    </Ecran>
  );
}
