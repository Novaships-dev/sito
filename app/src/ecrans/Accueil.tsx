// Accueil : ce qui s'est passé cette semaine, et les demandes à traiter en premier.
import { useApp, useCharge, Chargement, Ecran, useAction, Message, telephoneLisible } from '../ui';
import { jourCourt, heureLisible } from '../jour';
import type { Demande, JourStat } from '../types';

export function Accueil() {
  const stats = useCharge((d) => d.statistiques(28));
  const dem = useCharge((d) => d.demandes());
  const ent = useCharge((d) => d.entreprise());

  const semaine = (stats.valeur || []).slice(-7);
  const somme = (k: keyof Omit<JourStat, 'jour'>) => semaine.reduce((s, j) => s + j[k], 0);
  const nonLues = (dem.valeur || []).filter((d) => !d.lue_le);

  return (
    <Ecran titre={ent.valeur?.nom_affiche || 'Accueil'}>
      <section aria-labelledby="t-semaine">
        <h2 id="t-semaine">Ces 7 derniers jours</h2>
        <Chargement {...stats} />
        {stats.valeur && (
          <>
            <dl className="chiffres">
              <div><dt>Visites du site</dt><dd data-mesure="visites">{somme('visites')}</dd></div>
              <div><dt>Appels</dt><dd data-mesure="appels">{somme('appels')}</dd></div>
              <div><dt>Demandes</dt><dd data-mesure="demandes">{somme('demandes')}</dd></div>
            </dl>
            <Courbe jours={stats.valeur} />
          </>
        )}
      </section>

      <section aria-labelledby="t-demandes">
        <h2 id="t-demandes">Demandes {nonLues.length > 0 && <span className="compteur">{nonLues.length} à lire</span>}</h2>
        <Chargement {...dem} />
        {dem.valeur && dem.valeur.length === 0 && <p className="discret">Aucune demande reçue pour l’instant.</p>}
        <ul className="liste">
          {(dem.valeur || []).slice(0, 20).map((d) => <LigneDemande key={d.id} d={d} apres={dem.recharger} />)}
        </ul>
      </section>
    </Ecran>
  );
}

function LigneDemande({ d, apres }: { d: Demande; apres: () => void }) {
  const { donnees } = useApp();
  const a = useAction();
  return (
    <li className={`carte ${d.lue_le ? '' : 'non-lue'}`}>
      <p className="entete-carte">
        <strong>{d.nom || 'Sans nom'}</strong>
        <span className="discret">{heureLisible(d.recue_le)}{d.lue_le ? '' : ', nouvelle'}</span>
      </p>
      <p className="message">{d.message}</p>
      <div className="actions">
        {d.telephone && <a className="bouton" href={`tel:${d.telephone.replace(/[^\d+]/g, '')}`}>Appeler {telephoneLisible(d.telephone.replace(/\s/g, ''))}</a>}
        {d.courriel && <a className="bouton secondaire" href={`mailto:${d.courriel}`}>Répondre par e-mail</a>}
        {!d.lue_le && <button className="bouton secondaire" disabled={a.occupe} onClick={async () => { if (await a.lancer(() => donnees.marquerLue(d.id))) apres(); }}>Marquer comme lue</button>}
      </div>
      <Message erreur={a.erreur} />
    </li>
  );
}

// Visites des 28 derniers jours, une barre par jour. Le tableau en dessous
// donne les mêmes chiffres en texte (lecteurs d'écran).
function Courbe({ jours }: { jours: JourStat[] }) {
  const max = Math.max(1, ...jours.map((j) => j.visites));
  return (
    <figure className="courbe">
      <figcaption>Visites par jour, 4 dernières semaines</figcaption>
      <div className="barres" aria-hidden="true">
        {jours.map((j) => <span key={j.jour} style={{ height: `${Math.max(2, (j.visites / max) * 100)}%` }} title={`${jourCourt(j.jour)} : ${j.visites}`} />)}
      </div>
      <p className="axe" aria-hidden="true"><span>{jourCourt(jours[0].jour)}</span><span>{jourCourt(jours[jours.length - 1].jour)}</span></p>
      <details>
        <summary>Voir les chiffres</summary>
        <table>
          <thead><tr><th scope="col">Jour</th><th scope="col">Visites</th><th scope="col">Appels</th><th scope="col">Demandes</th></tr></thead>
          <tbody>{[...jours].reverse().map((j) => <tr key={j.jour}><th scope="row">{jourCourt(j.jour)}</th><td>{j.visites}</td><td>{j.appels}</td><td>{j.demandes}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
