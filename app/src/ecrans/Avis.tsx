// Mes avis : les avis Google, et une réponse préparée que l'artisan relit,
// corrige et valide. Décision du 5 octobre : rien n'est publié sans sa validation.
import { useState } from 'react';
import { useApp, useCharge, Chargement, Ecran, useAction, Message, Pastille } from '../ui';
import { dateLisible } from '../jour';
import type { Avis as AvisT } from '../types';

export function Avis() {
  const avis = useCharge((d) => d.avis());
  const google = useCharge((d) => d.connexionGoogle());
  const liste = avis.valeur || [];
  const notes = liste.filter((a) => a.note != null);
  const moyenne = notes.length ? notes.reduce((s, a) => s + (a.note || 0), 0) / notes.length : null;

  return (
    <Ecran titre="Mes avis">
      <Chargement {...avis} />
      {moyenne != null && <p className="moyenne"><strong>{moyenne.toFixed(1).replace('.', ',')} sur 5</strong> <span className="discret">({notes.length} avis)</span></p>}
      {avis.valeur && liste.length === 0 && (
        <div className="carte">
          <p>Aucun avis récupéré pour l’instant.</p>
          {google.valeur?.etat !== 'connectee' && <p className="aide">Les avis arrivent une fois votre fiche Google reliée (écran « Ma fiche Google »).</p>}
        </div>
      )}
      <ul className="liste">{liste.map((a) => <li key={a.id}><LigneAvis avis={a} apres={avis.recharger} /></li>)}</ul>
    </Ecran>
  );
}

const etoiles = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function LigneAvis({ avis, apres }: { avis: AvisT; apres: () => void }) {
  const { donnees } = useApp();
  const [texte, setTexte] = useState(avis.brouillon || '');
  const a = useAction();
  const champ = `rep-${avis.id}`;

  return (
    <article className="carte">
      <p className="entete-carte">
        <strong>{avis.auteur || 'Client'}</strong>
        <span className="discret">{dateLisible(avis.ecrit_le)}</span>
      </p>
      {avis.note != null && <p className="etoiles" aria-label={`${avis.note} étoiles sur 5`}>{etoiles(avis.note)}</p>}
      {avis.texte ? <p className="message">{avis.texte}</p> : <p className="discret">Note sans commentaire.</p>}

      {avis.reponse ? (
        <div className="reponse"><p className="discret">Votre réponse publiée</p><p>{avis.reponse}</p></div>
      ) : avis.valide_le ? (
        <div className="reponse"><Pastille ton="attente">Validée, en cours de publication</Pastille><p>{avis.brouillon}</p></div>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); if (await a.lancer(() => donnees.validerReponse(avis.id, texte.trim()), 'Réponse validée : elle sera publiée sur Google.')) apres(); }}>
          <label htmlFor={champ}>Votre réponse</label>
          <p className="aide" id={`aide-${champ}`}>{avis.brouillon ? 'Proposition préparée pour vous : relisez, corrigez si besoin, puis validez.' : 'Écrivez votre réponse.'}</p>
          <textarea id={champ} rows={4} maxLength={4096} required aria-describedby={`aide-${champ}`} value={texte} onChange={(e) => setTexte(e.target.value)} />
          <Message erreur={a.erreur} fait={a.fait} />
          <button className="bouton" disabled={a.occupe || !texte.trim()}>Valider et publier</button>
        </form>
      )}
    </article>
  );
}
