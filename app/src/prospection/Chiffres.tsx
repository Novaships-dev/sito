// L'espace « Chiffres » (T72) : le chiffre d'affaires réellement encaissé, en
// courbe façon bourse, par jour, semaine, mois, année ; abonnements et ventes à
// l'année séparés ; revenu qui revient chaque mois ; ce qui reste après
// cotisations ; qui doit payer ce mois-ci ; la saisie des encaissements.
import { useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { useApp, useAction, useCharge, Chargement, Message } from '../ui';
import { jourParis } from '../jour';
import type { Encaissement, Formule } from '../types';
import { PERIODES, PRIX, aEncaisser, courbe, eurosPrecis, net, recurrent, resume, tauxPrelevements, type Periode, type Point } from './chiffres';

const LIBELLE: Record<Formule | 'autre', string> = { mensuel: 'Abonnement au mois', annuel: 'Site à l’année', autre: 'Autre' };
const dateCourte = (j: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${j}T12:00:00Z`));
const lireAcre = () => { try { return localStorage.getItem('sito-chiffres-acre') === 'oui'; } catch { return false; } };

export function Chiffres() {
  const { donnees } = useApp();
  const aujourdhui = jourParis();
  const enc = useCharge((d) => d.encaissements());
  const ventes = useCharge((d) => d.ventes());
  const [periode, setPeriode] = useState<Periode>('1M');
  const [acre, setAcre] = useState(lireAcre);
  const [saisie, setSaisie] = useState(false);
  const action = useAction();
  const recharger = () => { void enc.recharger(); void ventes.recharger(); };

  const tous = enc.valeur || [];
  const r = useMemo(() => resume(tous, periode, aujourdhui), [tous, periode, aujourdhui]);
  const points = useMemo(() => courbe(tous, periode, aujourdhui), [tous, periode, aujourdhui]);
  const rec = recurrent(ventes.valeur || []);
  const dus = aEncaisser(ventes.valeur || [], tous, aujourdhui);
  const annee = resume(tous, '1A', aujourdhui).ca;

  const basculerAcre = () => { const v = !acre; setAcre(v); try { localStorage.setItem('sito-chiffres-acre', v ? 'oui' : 'non'); } catch { /* navigation privée */ } };

  return (
    <div className="c-chiffres">
      <Chargement erreur={enc.erreur || ventes.erreur} charge={(enc.charge && !enc.valeur) || (ventes.charge && !ventes.valeur)} recharger={recharger} />
      <Bourse points={points} total={r.ca} variation={r.variation} periode={periode} />
      <div className="c-periodes" role="group" aria-label="Période">
        {PERIODES.map((p) => <button key={p.id} type="button" aria-pressed={periode === p.id} onClick={() => setPeriode(p.id)}>{p.texte}</button>)}
      </div>

      <dl className="p-tuiles c-tuiles">
        <div><dt>Abonnements au mois</dt><dd>{eurosPrecis(r.abonnements)}</dd></div>
        <div><dt>Sites à l’année</dt><dd>{eurosPrecis(r.oneShot)}</dd></div>
        <div><dt>Encaissements</dt><dd>{r.nombre}</dd></div>
        <div><dt>Revient chaque mois</dt><dd>{eurosPrecis(rec.mensuel)}</dd></div>
        <div><dt>Abonnés actifs</dt><dd>{rec.abonnesMois + rec.abonnesAn}</dd></div>
        <div><dt>Il vous reste ({PERIODES.find((p) => p.id === periode)?.texte.toLowerCase()})</dt><dd>{eurosPrecis(net(r.ca, acre))}</dd></div>
      </dl>
      <div className="c-net">
        <p>Estimation de ce qui vous reste après cotisations URSSAF, formation et impôt libératoire : <strong>{String(Math.round(tauxPrelevements(acre) * 1000) / 10).replace('.', ',')} %</strong> prélevés. Sur 12 mois : {eurosPrecis(annee)} encaissés, environ {eurosPrecis(net(annee, acre))} pour vous.</p>
        <label className="c-acre" htmlFor="c-acre"><input id="c-acre" type="checkbox" checked={acre} onChange={basculerAcre} /> J’ai l’ACRE (cotisations divisées par deux la première année)</label>
      </div>

      {dus.length > 0 && (
        <section className="p-bloc c-dus" aria-labelledby="c-dus-titre">
          <h3 id="c-dus-titre">À encaisser ce mois ({dus.length})</h3>
          {dus.map((v) => (
            <div key={v.id} className="c-du">
              <span><strong>{v.nom}</strong><small>Abonnement au mois depuis le {dateCourte(v.debut_le)}</small></span>
              <button type="button" className="p-bouton p-bouton--jaune" disabled={action.occupe}
                onClick={() => void action.lancer(async () => { await donnees.ajouterEncaissement({ vente_id: v.id, nom: v.nom, formule: 'mensuel', montant: PRIX.mensuel, encaisse_le: aujourdhui, note: null }); recharger(); }, `${v.nom} : ${eurosPrecis(PRIX.mensuel)} encaissés.`)}>
                Encaissé {eurosPrecis(PRIX.mensuel)}
              </button>
            </div>
          ))}
          <Message erreur={action.erreur} fait={action.fait} />
        </section>
      )}

      <section className="p-bloc" aria-labelledby="c-liste-titre">
        <div className="c-liste-tete">
          <h3 id="c-liste-titre">Encaissements</h3>
          <button type="button" className="p-bouton p-bouton--verre" onClick={() => setSaisie(true)}>+ Encaissement</button>
        </div>
        {!tous.length && !enc.charge && <p className="p-discret">Aucun encaissement pour l’instant. Quand un artisan signe, passez sa fiche en « Abonné » : le paiement arrive ici.</p>}
        <ul className="c-liste">
          {[...tous].sort((a, b) => b.encaisse_le.localeCompare(a.encaisse_le) || b.cree_le.localeCompare(a.cree_le)).slice(0, 50).map((e) => (
            <Ligne key={e.id} e={e} retirer={() => void action.lancer(async () => { await donnees.retirerEncaissement(e.id); recharger(); }, 'Encaissement retiré.')} />
          ))}
        </ul>
      </section>

      {saisie && <Saisie aujourdhui={aujourdhui} fermer={() => setSaisie(false)} apres={() => { setSaisie(false); recharger(); }} />}
    </div>
  );
}

function Ligne({ e, retirer }: { e: Encaissement; retirer: () => void }) {
  const [confirmer, setConfirmer] = useState(false);
  return (
    <li className="c-ligne">
      <span className="c-ligne-date">{dateCourte(e.encaisse_le)}</span>
      <span className="c-ligne-nom"><strong>{e.nom}</strong><small>{LIBELLE[e.formule]}{e.source === 'stripe' ? ', Stripe' : ''}{e.note ? `, ${e.note}` : ''}</small></span>
      <span className="c-ligne-montant">+{eurosPrecis(e.montant)}</span>
      {e.source === 'manuel' && (confirmer
        ? <button type="button" className="p-bouton p-bouton--verre c-retirer" onClick={retirer}>Confirmer</button>
        : <button type="button" className="p-bouton p-bouton--verre c-retirer" aria-label={`Retirer l’encaissement de ${e.nom}`} onClick={() => setConfirmer(true)}>Retirer</button>)}
    </li>
  );
}

function Saisie({ aujourdhui, fermer, apres }: { aujourdhui: string; fermer: () => void; apres: () => void }) {
  const { donnees } = useApp();
  const action = useAction();
  const [f, setF] = useState({ nom: '', formule: 'annuel' as Formule | 'autre', montant: String(PRIX.annuel), encaisse_le: aujourdhui, note: '' });
  const choisir = (formule: Formule | 'autre') => setF({ ...f, formule, montant: formule === 'autre' ? f.montant : String(PRIX[formule]) });
  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await action.lancer(() => donnees.ajouterEncaissement({ vente_id: null, nom: f.nom, formule: f.formule, montant: Number(f.montant.replace(',', '.')), encaisse_le: f.encaisse_le, note: f.note || null }));
    if (ok) apres();
  };
  return (
    <div className="p-voile" role="dialog" aria-modal="true" aria-labelledby="c-saisie-titre" onKeyDown={(e) => e.key === 'Escape' && fermer()}>
      <form className="p-ajout" onSubmit={envoyer}>
        <h2 id="c-saisie-titre">Ajouter un encaissement</h2>
        <label htmlFor="ce-nom">Client</label><input id="ce-nom" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} required autoFocus maxLength={160} />
        <div className="p-choix c-formules" role="group" aria-label="Formule">
          {(['mensuel', 'annuel', 'autre'] as const).map((x) => <button key={x} type="button" className="p-choix-btn" aria-pressed={f.formule === x} onClick={() => choisir(x)}>{x === 'mensuel' ? `Au mois ${eurosPrecis(PRIX.mensuel)}` : x === 'annuel' ? `À l’année ${eurosPrecis(PRIX.annuel)}` : 'Autre'}</button>)}
        </div>
        <div className="p-rang">
          <div><label htmlFor="ce-montant">Montant (€)</label><input id="ce-montant" inputMode="decimal" value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value })} required /></div>
          <div><label htmlFor="ce-date">Encaissé le</label><input id="ce-date" type="date" max={aujourdhui} value={f.encaisse_le} onChange={(e) => setF({ ...f, encaisse_le: e.target.value })} required /></div>
        </div>
        <label htmlFor="ce-note">Note (facultatif)</label><input id="ce-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={500} placeholder="Virement, chèque…" />
        <div className="p-rang-boutons">
          <button className="p-bouton p-bouton--verre" type="button" onClick={fermer}>Annuler</button>
          <button className="p-bouton p-bouton--jaune" type="submit" disabled={action.occupe} aria-busy={action.occupe}>Enregistrer</button>
        </div>
        <Message erreur={action.erreur} />
      </form>
    </div>
  );
}

// La courbe façon bourse : chiffre d'affaires cumulé, aire en dégradé, ligne de
// départ en pointillé, réticule et valeur sous le doigt ou la souris.
function Bourse({ points, total, variation, periode }: { points: Point[]; total: number; variation: number | null; periode: Periode }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const zone = useRef<SVGSVGElement>(null);
  const L = 600, H = 220, M = 8;
  const max = Math.max(1, ...points.map((p) => p.cumul));
  const x = (i: number) => (points.length < 2 ? L / 2 : M + (i / (points.length - 1)) * (L - 2 * M));
  const y = (v: number) => H - M - (v / max) * (H - 2 * M - 16);
  const ligne = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.cumul).toFixed(1)}`).join(' ');
  const aire = points.length ? `${ligne} L${x(points.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z` : '';
  const monte = total > 0;
  const pt = survol !== null ? points[survol] : null;
  const valeur = pt ? pt.cumul : total;
  const bouger = (e: PointerEvent<SVGSVGElement>) => {
    const r = zone.current?.getBoundingClientRect();
    if (!r || points.length < 1) return;
    const rel = ((e.clientX - r.left) / r.width) * L;
    const i = Math.round(((rel - M) / (L - 2 * M)) * (points.length - 1));
    setSurvol(Math.max(0, Math.min(points.length - 1, i)));
  };
  const long = PERIODES.find((p) => p.id === periode)?.long;
  return (
    <figure className={`c-bourse ${monte ? 'c-bourse--monte' : ''}`}>
      <figcaption>
        <span className="c-bourse-titre">Chiffre d’affaires encaissé {long}</span>
        <strong className="c-bourse-valeur">{eurosPrecis(valeur)}</strong>
        <span className="c-bourse-sous">
          {pt ? <>{periode === '1J' ? `à ${pt.etiquette}` : `au ${dateCourte(pt.t)}`}{pt.du ? `, +${eurosPrecis(pt.du)} ce ${periode === '1J' ? 'créneau' : periode === '1A' ? 'pas de 7 jours' : 'jour'}` : ''}</>
            : variation === null ? (periode === 'TOUT' ? 'depuis le premier encaissement' : 'rien sur la période d’avant')
              : <span className={variation >= 0 ? 'c-hausse' : 'c-baisse'}>{variation >= 0 ? '▲' : '▼'} {String(Math.abs(variation)).replace('.', ',')} % par rapport à la période d’avant</span>}
        </span>
      </figcaption>
      <svg ref={zone} viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Courbe du chiffre d’affaires cumulé ${long}, ${eurosPrecis(total)} au total`}
        onPointerMove={bouger} onPointerDown={bouger} onPointerLeave={() => setSurvol(null)}>
        <defs>
          <linearGradient id="c-degrade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={monte ? '#3ccf86' : '#8fa197'} stopOpacity=".45" />
            <stop offset="1" stopColor={monte ? '#3ccf86' : '#8fa197'} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={L} y1={H * f} y2={H * f} className="c-grille" />)}
        <line x1="0" x2={L} y1={y(0)} y2={y(0)} className="c-depart" />
        {aire && <path d={aire} fill="url(#c-degrade)" />}
        {ligne && <path d={ligne} className="c-ligne-courbe" vectorEffect="non-scaling-stroke" />}
        {pt && survol !== null && (
          <>
            <line x1={x(survol)} x2={x(survol)} y1="0" y2={H} className="c-reticule" vectorEffect="non-scaling-stroke" />
            <circle cx={x(survol)} cy={y(pt.cumul)} r="5" className="c-point" />
          </>
        )}
        {!pt && points.length > 0 && <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].cumul)} r="4.5" className="c-point c-point--fin" />}
      </svg>
      <div className="c-axe"><span>{points[0] ? (periode === '1J' ? '0 h' : dateCourte(points[0].t)) : ''}</span><span>{periode === '1J' ? '23 h' : 'Aujourd’hui'}</span></div>
    </figure>
  );
}
