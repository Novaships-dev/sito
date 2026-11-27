// L'espace de prospection de Fabrice (T70) : la liste du jour, la fiche de
// chaque artisan (diagnostic web, angle d'appel, maquette), le résultat en un
// toucher, le pipeline et le bilan. Réservé aux comptes prospecteurs : la base
// refuse les autres (migration …_prospection), l'écran ne fait que le dire.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useApp, useAction, useCharge, Chargement, Message } from '../ui';
import { jourParis, decalerJour } from '../jour';
import type { AppelProspect, Diagnostic, Prospect, StatutProspect } from '../types';
import {
  STATUTS, COLONNES, OBJECTIF_JOUR, listeDuJour, appelesAujourdhui, bilan, messageMaquette,
  numeroAppel, numeroLisible, numeroWhatsApp, jourOuvreSuivant,
} from './logique';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './prospection.css';
import { Chiffres } from './Chiffres';
import { PRIX, eurosPrecis } from './chiffres';

type Vue = 'jour' | 'pipeline' | 'bilan' | 'chiffres';
const jourDe = (iso: string) => jourParis(new Date(iso));
const dateLisible = (j: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${j}T12:00:00Z`));
const heureLisible = (iso: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso));
const lienGoogle = (p: Prospect) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.nom} ${p.commune || ''}`)}`;

function Statut({ s }: { s: StatutProspect }) {
  return <span className={`p-statut p-statut--${STATUTS[s].ton}`}>{STATUTS[s].texte}</span>;
}

export function Prospection({ route }: { route: string[] }) {
  const { donnees } = useApp();
  const aujourdhui = jourParis();
  const droit = useCharge((d) => d.estProspecteur());
  const liste = useCharge((d) => d.prospects());
  const appels = useCharge((d) => d.appelsRecents(7));
  const [vue, setVue] = useState<Vue>('jour');
  const [ajout, setAjout] = useState(false);
  const ouvert = route[1] ? decodeURIComponent(route[1]) : null;

  useEffect(() => { document.title = 'Prospection, MonSiteArtisan'; }, []);
  const recharger = () => { void liste.recharger(); void appels.recharger(); };

  const tous = liste.valeur || [];
  const jour = useMemo(() => listeDuJour(tous, aujourdhui), [tous, aujourdhui]);
  const faits = appelesAujourdhui(appels.valeur || [], aujourdhui, jourDe);
  const fiche = ouvert ? tous.find((p) => p.id === ouvert) : undefined;

  if (droit.charge && droit.valeur === undefined) return <main className="p-ecran" id="contenu" tabIndex={-1}><p className="p-discret">Chargement…</p></main>;
  if (!droit.valeur) {
    return (
      <main className="p-ecran" id="contenu" tabIndex={-1}>
        <h1>Prospection</h1>
        <p className="p-discret">Cet espace est réservé au compte de prospection de MonSiteArtisan.</p>
        <a className="p-bouton p-bouton--verre" href="#/chantiers">Retour</a>
      </main>
    );
  }

  return (
    <main className={`p-ecran ${fiche ? 'p-ecran--fiche' : ''}`} id="contenu" tabIndex={-1}>
      <header className="p-tete">
        <div>
          <p className="p-surtitre">Prospection</p>
          <h1>{vue === 'jour' ? `Appels du ${dateLisible(aujourdhui)}` : vue === 'pipeline' ? 'Pipeline' : vue === 'chiffres' ? 'Chiffres' : 'Bilan de la semaine'}</h1>
        </div>
        <div className="p-objectif" role="img" aria-label={`${faits} artisans appelés sur un objectif de ${OBJECTIF_JOUR}`}>
          <strong>{faits}</strong><span>/ {OBJECTIF_JOUR}</span>
          <i style={{ width: `${Math.min(100, (faits / OBJECTIF_JOUR) * 100)}%` }} />
        </div>
      </header>

      <nav className="p-onglets" aria-label="Vues de la prospection">
        {([['jour', `Aujourd’hui (${jour.length})`], ['pipeline', 'Pipeline'], ['bilan', 'Bilan'], ['chiffres', 'Chiffres']] as [Vue, string][]).map(([v, t]) => (
          <button key={v} type="button" aria-pressed={vue === v} onClick={() => { setVue(v); location.hash = '#/prospection'; }}>{t}</button>
        ))}
        <button type="button" className="p-onglets-ajout" onClick={() => setAjout(true)}>+ Ajouter</button>
      </nav>

      <Chargement erreur={liste.erreur} charge={liste.charge && !liste.valeur} recharger={liste.recharger} />

      {vue === 'chiffres' ? <Chiffres /> : (
      <div className="p-corps">
        <section className="p-colonne" aria-label="Liste">
          {vue === 'jour' && <ListeJour liste={jour} actif={ouvert} />}
          {vue === 'pipeline' && <Pipeline tous={tous} actif={ouvert} />}
          {vue === 'bilan' && <Bilan appels={appels.valeur || []} tous={tous} aujourdhui={aujourdhui} />}
        </section>
        {fiche && <Fiche key={fiche.id} p={fiche} aujourdhui={aujourdhui} apres={recharger} />}
        {ouvert && !fiche && !liste.charge && (
          <section className="p-fiche"><p>Cette fiche n’existe plus.</p><a className="p-bouton p-bouton--verre" href="#/prospection">Retour à la liste</a></section>
        )}
      </div>
      )}

      {ajout && <Ajout aujourdhui={aujourdhui} fermer={() => setAjout(false)} apres={(id) => { setAjout(false); recharger(); location.hash = `#/prospection/${encodeURIComponent(id)}`; }} />}
      {donnees.demo && <p className="p-demo">Démonstration : entreprises et numéros inventés.</p>}
    </main>
  );
}

function Carte({ p, actif }: { p: Prospect; actif: string | null }) {
  return (
    <a className={`p-carte ${actif === p.id ? 'p-carte--active' : ''}`} href={`#/prospection/${encodeURIComponent(p.id)}`} aria-current={actif === p.id ? 'true' : undefined}>
      <span className="p-carte-haut">
        <strong>{p.nom}</strong>
        {p.rappel_heure ? <span className="p-heure">{p.rappel_heure}</span> : <Statut s={p.statut} />}
      </span>
      <span className="p-carte-sous">{p.metier}{p.commune ? `, ${p.commune}` : ''}{p.note_google != null ? `, ${String(p.note_google).replace('.', ',')} ★ (${p.avis_google ?? 0})` : ''}</span>
      {p.angle && <span className="p-carte-angle">{p.angle}</span>}
    </a>
  );
}

function ListeJour({ liste, actif }: { liste: Prospect[]; actif: string | null }) {
  if (!liste.length) return <div className="p-vide"><strong>Liste du jour terminée.</strong><p>Les artisans de demain arrivent ce soir.</p></div>;
  const rappels = liste.filter((p) => p.statut !== 'a-appeler');
  const nouveaux = liste.filter((p) => p.statut === 'a-appeler');
  return (
    <>
      {rappels.length > 0 && <><h2 className="p-groupe">Rappels et relances ({rappels.length})</h2>{rappels.map((p) => <Carte key={p.id} p={p} actif={actif} />)}</>}
      {nouveaux.length > 0 && <><h2 className="p-groupe">Nouveaux ({nouveaux.length})</h2>{nouveaux.map((p) => <Carte key={p.id} p={p} actif={actif} />)}</>}
    </>
  );
}

function Pipeline({ tous, actif }: { tous: Prospect[]; actif: string | null }) {
  return (
    <div className="p-pipeline">
      {COLONNES.map((c) => {
        const dans = tous.filter((p) => STATUTS[p.statut].colonne === c);
        return (
          <div key={c} className="p-pipe-col">
            <h2 className="p-groupe">{c} ({dans.length})</h2>
            {dans.map((p) => <Carte key={p.id} p={p} actif={actif} />)}
            {!dans.length && <p className="p-discret">Personne.</p>}
          </div>
        );
      })}
    </div>
  );
}

function Bilan({ appels, tous, aujourdhui }: { appels: AppelProspect[]; tous: Prospect[]; aujourdhui: string }) {
  const b = bilan(appels);
  const duJour = bilan(appels.filter((a) => jourDe(a.fait_le) === aujourdhui));
  const jours = Array.from({ length: 7 }, (_, i) => decalerJour(aujourdhui, i - 6));
  const parJour = jours.map((j) => appels.filter((a) => jourDe(a.fait_le) === j).length);
  const max = Math.max(1, ...parJour);
  const tuiles: [string, string | number][] = [
    ['Appels', b.appels], ['Joints', b.joints], ['Intéressés', b.interesses], ['Gagnés', b.gagnes],
    ['Refus', b.refus], ['Transformation', b.taux == null ? 'pas encore' : `${b.taux} %`],
  ];
  return (
    <div className="p-bilan">
      <p className="p-discret">Sept derniers jours. Aujourd’hui : {duJour.appels} appel{duJour.appels > 1 ? 's' : ''}, {duJour.joints} joint{duJour.joints > 1 ? 's' : ''}, {duJour.gagnes} gagné{duJour.gagnes > 1 ? 's' : ''}.</p>
      <dl className="p-tuiles">{tuiles.map(([t, v]) => <div key={t}><dt>{t}</dt><dd>{v}</dd></div>)}</dl>
      <figure className="p-barres" aria-label="Appels par jour">
        {jours.map((j, i) => (
          <div key={j}><span style={{ height: `${(parJour[i] / max) * 100}%` }} title={`${parJour[i]} appels`} /><small>{dateLisible(j).slice(0, 3)}</small></div>
        ))}
      </figure>
      <p className="p-discret">Fiches en cours : {tous.filter((p) => !['refuse', 'ne-plus-appeler', 'abonne', 'essai-lance'].includes(p.statut)).length}. Abonnés : {tous.filter((p) => p.statut === 'abonne').length}.</p>
    </div>
  );
}

const RESULTATS: StatutProspect[] = ['pas-de-reponse', 'a-rappeler', 'interesse', 'maquette-envoyee', 'essai-lance', 'abonne', 'refuse', 'ne-plus-appeler'];

function Fiche({ p, aujourdhui, apres }: { p: Prospect; aujourdhui: string; apres: () => void }) {
  const { donnees } = useApp();
  const historique = useCharge((d) => d.appelsProspect(p.id), [p.id, p.maj_le]);
  const action = useAction();
  const [choix, setChoix] = useState<StatutProspect | null>(null);
  const [rappelLe, setRappelLe] = useState(jourOuvreSuivant(aujourdhui));
  const [rappelHeure, setRappelHeure] = useState('');
  const [raison, setRaison] = useState('');
  const [note, setNote] = useState('');
  const [formule, setFormule] = useState<'mensuel' | 'annuel'>('annuel');
  const [encaisse, setEncaisse] = useState(true);
  const [notes, setNotes] = useState(p.notes || '');
  const notesAction = useAction();
  const besoinDate = choix === 'a-rappeler' || choix === 'interesse' || choix === 'maquette-envoyee';
  const sms = `sms:${p.telephone ? numeroAppel(p.telephone) : ''}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(messageMaquette(p))}`;
  const wa = p.telephone ? `https://wa.me/${numeroWhatsApp(p.telephone)}?text=${encodeURIComponent(messageMaquette(p))}` : null;

  const valider = async (e: FormEvent) => {
    e.preventDefault();
    if (!choix) return;
    const ok = await action.lancer(async () => {
      await donnees.enregistrerResultat(p.id, {
        statut: choix, rappel_le: besoinDate ? rappelLe : null, rappel_heure: besoinDate && rappelHeure ? rappelHeure : null,
        raison_refus: choix === 'refuse' ? raison : null, note,
      });
      // Un artisan qui signe devient une vente ; son premier paiement entre dans les chiffres.
      if (choix === 'abonne') await donnees.creerVente({ fiche_id: p.id, nom: p.nom, formule, encaisse_aujourdhui: encaisse });
    }, choix === 'abonne' ? (encaisse ? `Enregistré : ${eurosPrecis(PRIX[formule])} ajoutés aux chiffres.` : 'Enregistré : abonné ajouté aux chiffres.') : 'Enregistré.');
    if (ok) { setChoix(null); setNote(''); apres(); }
  };

  return (
    <section className="p-fiche" aria-labelledby="p-fiche-titre">
      <a className="p-retour" href="#/prospection">← Liste</a>
      <div className="p-fiche-tete">
        <div>
          <h2 id="p-fiche-titre">{p.nom}</h2>
          <p className="p-discret">{p.metier}{p.commune ? `, ${p.commune}` : ''}{p.siren ? `, SIREN ${p.siren}` : ''}</p>
        </div>
        <Statut s={p.statut} />
      </div>

      <div className="p-actions-appel">
        {p.telephone
          ? <a className="p-bouton p-bouton--appel" href={`tel:${numeroAppel(p.telephone)}`}>Appeler le {numeroLisible(p.telephone)}</a>
          : <a className="p-bouton p-bouton--verre" href={lienGoogle(p)} target="_blank" rel="noreferrer noopener">Pas de numéro aujourd’hui : ouvrir la fiche Google</a>}
        <a className="p-bouton p-bouton--verre" href={lienGoogle(p)} target="_blank" rel="noreferrer noopener">Fiche Google</a>
        {p.lien_maquette && <a className="p-bouton p-bouton--verre" href={p.lien_maquette} target="_blank" rel="noreferrer noopener">Voir sa maquette</a>}
        {p.telephone && <a className="p-bouton p-bouton--verre" href={sms}>Maquette par SMS</a>}
        {wa && <a className="p-bouton p-bouton--verre" href={wa} target="_blank" rel="noreferrer noopener">Maquette par WhatsApp</a>}
      </div>

      {p.angle && <div className="p-angle"><span>Angle d’appel</span><p>{p.angle}</p></div>}
      <Analyse d={p.diagnostic || {}} />

      <div className="p-diag">
        <div className="p-diag-col p-diag-col--fort">
          <h3>Points forts</h3>
          {p.points_forts.length ? <ul>{p.points_forts.map((c, i) => <li key={i}><strong>{c.sujet}</strong> {c.texte}</li>)}</ul> : <p className="p-discret">Rien de relevé.</p>}
        </div>
        <div className="p-diag-col p-diag-col--faible">
          <h3>Points faibles</h3>
          {p.points_faibles.length ? <ul>{p.points_faibles.map((c, i) => <li key={i}><strong>{c.sujet}</strong> {c.texte}</li>)}</ul> : <p className="p-discret">Rien de relevé.</p>}
        </div>
      </div>
      <dl className="p-faits">
        <div><dt>Google</dt><dd>{p.note_google != null ? `${String(p.note_google).replace('.', ',')} sur 5, ${p.avis_google ?? 0} avis` : 'Pas de note'}</dd></div>
        <div><dt>Site actuel</dt><dd>{p.site_actuel || 'Aucun relevé'}</dd></div>
        {p.a_appeler_le && <div><dt>Prévu</dt><dd>{p.a_appeler_le === aujourdhui ? 'Aujourd’hui' : dateLisible(p.a_appeler_le)}{p.rappel_heure ? ` à ${p.rappel_heure}` : ''}</dd></div>}
        {p.raison_refus && <div><dt>Raison du refus</dt><dd>{p.raison_refus}</dd></div>}
      </dl>

      <form className="p-resultat" onSubmit={valider}>
        <h3>Résultat de l’appel</h3>
        <div className="p-choix" role="group" aria-label="Résultat">
          {RESULTATS.map((s) => (
            <button key={s} type="button" className={`p-choix-btn p-choix-btn--${STATUTS[s].ton}`} aria-pressed={choix === s} onClick={() => { setChoix(s); action.effacer(); }}>{STATUTS[s].texte}</button>
          ))}
        </div>
        {besoinDate && (
          <div className="p-rang">
            <div><label htmlFor="p-rappel-le">{choix === 'a-rappeler' ? 'Rappeler le' : 'Relancer le'}</label><input id="p-rappel-le" type="date" min={aujourdhui} value={rappelLe} onChange={(e) => setRappelLe(e.target.value)} required /></div>
            <div><label htmlFor="p-rappel-heure">À (facultatif)</label><input id="p-rappel-heure" type="time" value={rappelHeure} onChange={(e) => setRappelHeure(e.target.value)} /></div>
          </div>
        )}
        {choix === 'refuse' && <><label htmlFor="p-raison">Raison du refus</label><input id="p-raison" value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Déjà un site, trop cher, pas le temps…" maxLength={300} /></>}
        {choix === 'abonne' && (
          <div className="p-signe">
            <div className="p-choix p-choix--2" role="group" aria-label="Formule choisie">
              <button type="button" className="p-choix-btn p-choix-btn--ok" aria-pressed={formule === 'mensuel'} onClick={() => { setFormule('mensuel'); setEncaisse(false); }}>Au mois, {eurosPrecis(PRIX.mensuel)}</button>
              <button type="button" className="p-choix-btn p-choix-btn--ok" aria-pressed={formule === 'annuel'} onClick={() => { setFormule('annuel'); setEncaisse(true); }}>À l’année, {eurosPrecis(PRIX.annuel)}</button>
            </div>
            <label className="c-acre" htmlFor="p-encaisse"><input id="p-encaisse" type="checkbox" checked={encaisse} onChange={(e) => setEncaisse(e.target.checked)} /> Premier paiement de {eurosPrecis(PRIX[formule])} encaissé aujourd’hui</label>
            {formule === 'mensuel' && <p className="p-discret">Au mois, le premier mois est offert : il apparaîtra dans « À encaisser » le mois prochain.</p>}
          </div>
        )}
        {choix === 'ne-plus-appeler' && <p className="p-alerte">Il sort de la liste pour de bon et son numéro est effacé. Sa maquette est retirée le soir même.</p>}
        {choix && <><label htmlFor="p-note">Note sur l’appel (facultatif)</label><textarea id="p-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} /></>}
        <button className="p-bouton p-bouton--jaune" type="submit" disabled={!choix || action.occupe} aria-busy={action.occupe}>Enregistrer le résultat</button>
        <Message erreur={action.erreur} fait={action.fait} />
      </form>

      <div className="p-bloc">
        <label htmlFor="p-notes"><h3>Notes</h3></label>
        <textarea id="p-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={4000} placeholder="Ce qu’il a dit, ce qu’il veut, qui décide…" />
        <button className="p-bouton p-bouton--verre" type="button" disabled={notesAction.occupe || notes === (p.notes || '')} onClick={() => void notesAction.lancer(async () => { await donnees.enregistrerNotes(p.id, notes); apres(); }, 'Notes enregistrées.')}>Enregistrer les notes</button>
        <Message erreur={notesAction.erreur} fait={notesAction.fait} />
      </div>

      <div className="p-bloc">
        <h3>Historique</h3>
        <Chargement erreur={historique.erreur} charge={historique.charge && !historique.valeur} />
        {historique.valeur && !historique.valeur.length && <p className="p-discret">Jamais appelé.</p>}
        <ol className="p-histo">
          {(historique.valeur || []).map((a) => <li key={a.id}><span>{heureLisible(a.fait_le)}</span><Statut s={a.statut} />{a.note && <em>{a.note}</em>}</li>)}
        </ol>
      </div>
    </section>
  );
}

// L'analyse de l'artisan, préparée le soir (T73) : qui il est, où il en est
// sur internet canal par canal, ce que disent ses clients, ses concurrents,
// quoi lui demander, quoi répondre à ses objections, quoi lui proposer.
const ETAT_PRESENCE = { bon: 'Bon', moyen: 'Moyen', absent: 'Absent' } as const;
function Analyse({ d }: { d: Diagnostic }) {
  const vide = !d.resume && !d.presence?.length && !d.clients && !d.concurrents && !d.questions?.length && !d.objections?.length && !d.proposition;
  if (vide) return null;
  return (
    <div className="p-analyse">
      <h3>Analyse avant l’appel</h3>
      {d.resume && <p className="p-analyse-resume">{d.resume}</p>}
      {d.proposition && <div className="p-analyse-bloc p-analyse-prop"><span>Ce qu’on lui propose</span><p>{d.proposition}</p></div>}
      {!!d.presence?.length && (
        <ul className="p-presence">
          {d.presence.map((c, i) => (
            <li key={i}><span className={`p-etat p-etat--${c.etat}`}>{ETAT_PRESENCE[c.etat] || c.etat}</span><strong>{c.canal}</strong><small>{c.detail}</small></li>
          ))}
        </ul>
      )}
      {d.clients && <div className="p-analyse-bloc"><span>Ce que disent ses clients</span><p>{d.clients}</p></div>}
      {d.concurrents && <div className="p-analyse-bloc"><span>Ses concurrents</span><p>{d.concurrents}</p></div>}
      {!!d.questions?.length && <div className="p-analyse-bloc"><span>Questions à lui poser</span><ol>{d.questions.map((q, i) => <li key={i}>{q}</li>)}</ol></div>}
      {!!d.objections?.length && (
        <div className="p-analyse-bloc"><span>S’il dit…</span>
          {d.objections.map((o, i) => <details key={i} className="p-objection"><summary>« {o.objection} »</summary><p>{o.reponse}</p></details>)}
        </div>
      )}
    </div>
  );
}

function Ajout({ aujourdhui, fermer, apres }: { aujourdhui: string; fermer: () => void; apres: (id: string) => void }) {
  const { donnees } = useApp();
  const action = useAction();
  const [f, setF] = useState({ nom: '', metier: '', commune: '', telephone: '', a_appeler_le: aujourdhui, notes: '' });
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    let id = '';
    const ok = await action.lancer(async () => {
      const p = await donnees.ajouterProspect({ nom: f.nom, metier: f.metier, commune: f.commune || null, telephone: f.telephone || null, a_appeler_le: f.a_appeler_le, notes: f.notes || null });
      id = p.id;
    });
    if (ok) apres(id);
  };
  return (
    <div className="p-voile" role="dialog" aria-modal="true" aria-labelledby="p-ajout-titre" onKeyDown={(e) => e.key === 'Escape' && fermer()}>
      <form className="p-ajout" onSubmit={envoyer}>
        <h2 id="p-ajout-titre">Ajouter un prospect</h2>
        <label htmlFor="pa-nom">Nom de l’entreprise</label><input id="pa-nom" value={f.nom} onChange={maj('nom')} required autoFocus maxLength={160} />
        <div className="p-rang">
          <div><label htmlFor="pa-metier">Métier</label><input id="pa-metier" value={f.metier} onChange={maj('metier')} placeholder="Façadier, couvreur…" maxLength={60} /></div>
          <div><label htmlFor="pa-commune">Commune</label><input id="pa-commune" value={f.commune} onChange={maj('commune')} maxLength={80} /></div>
        </div>
        <div className="p-rang">
          <div><label htmlFor="pa-tel">Téléphone</label><input id="pa-tel" type="tel" inputMode="tel" value={f.telephone} onChange={maj('telephone')} placeholder="06 …" /></div>
          <div><label htmlFor="pa-jour">À appeler le</label><input id="pa-jour" type="date" min={aujourdhui} value={f.a_appeler_le} onChange={maj('a_appeler_le')} required /></div>
        </div>
        <p className="p-discret">Le numéro est effacé une fois le jour prévu passé.</p>
        <label htmlFor="pa-notes">Notes</label><textarea id="pa-notes" value={f.notes} onChange={maj('notes')} rows={2} maxLength={4000} placeholder="Croisé sur un chantier, recommandé par…" />
        <div className="p-rang-boutons">
          <button className="p-bouton p-bouton--verre" type="button" onClick={fermer}>Annuler</button>
          <button className="p-bouton p-bouton--jaune" type="submit" disabled={action.occupe} aria-busy={action.occupe}>Ajouter</button>
        </div>
        <Message erreur={action.erreur} />
      </form>
    </div>
  );
}

export default Prospection;
