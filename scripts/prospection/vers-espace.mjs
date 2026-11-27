// Remplit l'espace de prospection de Fabrice (T71) : les fiches du jour d'appel,
// avec le numéro public relevé le soir, le diagnostic web et l'angle d'appel,
// dans la table `fiches_prospection` de Supabase (migration 20261127002326).
//
// Décision du 27 nov. 2026 : « aucun numero stocker juste ceux du jour a
// appeler ». Ce script n'écrit un numéro que pour le jour d'appel donné ; la
// base efface chaque nuit ceux qui ne sont plus du jour (pg_cron). Le fichier
// d'entrée porte des numéros : il reste hors de Git (`.gitignore`).
//
// Usage :
//   node scripts/prospection/vers-espace.mjs --rappels [--jour AAAA-MM-JJ]
//       liste les fiches déjà dans l'espace à appeler ce jour-là (rappels,
//       relances) : leur numéro est à relever comme celui des nouveaux.
//   node scripts/prospection/vers-espace.mjs --fiches prospection/fiches-du-jour.json [--jour AAAA-MM-JJ] [--sec]
//       crée les nouvelles fiches, met à jour le diagnostic et le numéro des
//       fiches déjà là, sans toucher à leur statut ni aux notes de Fabrice.
//       Jamais une fiche « refusé », « ne plus appeler », « abonné » ou « essai
//       lancé » ne revient. --sec : tout est vérifié, rien n'est écrit.
// Jour par défaut : le jour ouvré qui suit aujourd'hui (heure de Paris).
// Besoin du .env : SUPABASE_URL, SUPABASE_CLE_SERVICE (jamais affichées).
import { readFileSync } from 'node:fs';
import { exiger } from '../env.mjs';

const HORS_LISTE = ['refuse', 'ne-plus-appeler', 'abonne', 'essai-lance'];

export function jourParis(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function jourOuvreSuivant(jour) {
  const d = new Date(`${jour}T12:00:00Z`);
  do d.setUTCDate(d.getUTCDate() + 1); while ([0, 6].includes(d.getUTCDay()));
  return d.toISOString().slice(0, 10);
}

const texte = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const constats = (v) => (Array.isArray(v) ? v.filter((c) => c && typeof c.sujet === 'string' && typeof c.texte === 'string')
  .slice(0, 8).map((c) => ({ sujet: c.sujet.trim().slice(0, 40), texte: c.texte.trim().slice(0, 200) })) : []);

// L'analyse de l'artisan (T73) : seulement les champs connus, bornés.
export function diagnostic(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {};
  const sortie = {};
  for (const k of ['resume', 'clients', 'concurrents', 'proposition']) { const v = texte(d[k], 600); if (v) sortie[k] = v; }
  if (Array.isArray(d.presence)) {
    const p = d.presence.filter((c) => c && typeof c.canal === 'string' && ['bon', 'moyen', 'absent'].includes(c.etat))
      .slice(0, 8).map((c) => ({ canal: c.canal.trim().slice(0, 40), etat: c.etat, detail: texte(c.detail, 200) || '' }));
    if (p.length) sortie.presence = p;
  }
  if (Array.isArray(d.questions)) { const q = d.questions.map((x) => texte(x, 200)).filter(Boolean).slice(0, 6); if (q.length) sortie.questions = q; }
  if (Array.isArray(d.objections)) {
    const o = d.objections.filter((x) => x && texte(x.objection, 200) && texte(x.reponse, 400)).slice(0, 6)
      .map((x) => ({ objection: texte(x.objection, 200), reponse: texte(x.reponse, 400) }));
    if (o.length) sortie.objections = o;
  }
  return sortie;
}

// Une fiche lue du fichier du soir : propre, ou une raison de l'écarter.
export function nettoyer(f) {
  if (!f || typeof f !== 'object') return { erreur: 'fiche illisible' };
  const nom = texte(f.nom, 160);
  if (!nom) return { erreur: 'nom absent' };
  const siren = typeof f.siren === 'string' && /^\d{9}$/.test(f.siren) ? f.siren : null;
  if (!siren) return { erreur: `${nom} : SIREN absent ou faux (9 chiffres)` };
  let telephone = null;
  if (f.telephone != null && f.telephone !== '') {
    const chiffres = String(f.telephone).replace(/[^\d+]/g, '');
    if (!/^(0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(chiffres)) return { erreur: `${nom} : numéro illisible` };
    telephone = chiffres.replace(/^\+33/, '0').replace(/(\d{2})(?=\d)/g, '$1 ');
  }
  const lien = texte(f.lien_maquette, 300);
  if (lien && !/^https:\/\//.test(lien)) return { erreur: `${nom} : lien de maquette sans https` };
  const note = f.note_google == null ? null : Number(f.note_google);
  if (note != null && !(note >= 0 && note <= 5)) return { erreur: `${nom} : note Google hors de 0 à 5` };
  const avis = f.avis_google == null ? null : Number(f.avis_google);
  if (avis != null && !(Number.isInteger(avis) && avis >= 0)) return { erreur: `${nom} : nombre d'avis faux` };
  return {
    fiche: {
      siren, nom, metier: texte(f.metier, 60) || 'Autre', commune: texte(f.commune, 80), telephone,
      points_forts: constats(f.points_forts), points_faibles: constats(f.points_faibles),
      diagnostic: diagnostic(f.diagnostic),
      angle: texte(f.angle, 400), lien_maquette: lien, note_google: note == null ? null : Math.round(note * 10) / 10,
      avis_google: avis, site_actuel: texte(f.site_actuel, 200),
    },
  };
}

// Un petit client PostgREST : la clé de service ne sort jamais d'ici.
export function client({ url, cle, fetch: f = globalThis.fetch }) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`;
  const entetes = { apikey: cle, authorization: `Bearer ${cle}`, 'content-type': 'application/json', prefer: 'return=representation' };
  return async (methode, chemin, corps) => {
    const r = await f(`${base}/${chemin}`, { method: methode, headers: entetes, body: corps === undefined ? undefined : JSON.stringify(corps) });
    const t = await r.text();
    if (!r.ok) throw new Error(`Supabase ${methode} ${chemin.split('?')[0]} : ${r.status} ${t.slice(0, 200)}`);
    return t ? JSON.parse(t) : null;
  };
}

export async function rappelsDuJour(appel, jour) {
  const lignes = await appel('GET', `fiches_prospection?a_appeler_le=lte.${jour}&statut=not.in.(${HORS_LISTE.join(',')})&select=id,siren,nom,commune,metier,statut,a_appeler_le,telephone,source`);
  return lignes.filter((l) => l.statut !== 'a-appeler' || l.a_appeler_le < jour || !l.telephone);
}

export async function verserFiches(appel, entrees, jour, { sec = false } = {}) {
  const bilan = { crees: 0, misesAJour: 0, ecartees: [], numeros: 0 };
  const propres = [];
  for (const e of entrees) {
    const n = nettoyer(e);
    if (n.erreur) bilan.ecartees.push(n.erreur); else propres.push(n.fiche);
  }
  const vus = new Set();
  const uniques = propres.filter((p) => (vus.has(p.siren) ? (bilan.ecartees.push(`${p.nom} : SIREN en double dans le fichier`), false) : vus.add(p.siren)));
  if (!uniques.length) return bilan;
  const existants = await appel('GET', `fiches_prospection?siren=in.(${uniques.map((u) => u.siren).join(',')})&select=id,siren,statut,a_appeler_le`);
  const parSiren = new Map(existants.map((x) => [x.siren, x]));
  for (const p of uniques) {
    const deja = parSiren.get(p.siren);
    if (deja && HORS_LISTE.includes(deja.statut)) { bilan.ecartees.push(`${p.nom} : déjà « ${deja.statut} », ne revient pas`); continue; }
    if (deja) {
      // Le diagnostic se met à jour ; le statut, la date prévue et les notes de Fabrice restent.
      const appeleCeJour = deja.a_appeler_le !== null && deja.a_appeler_le <= jour;
      const champs = { points_forts: p.points_forts, points_faibles: p.points_faibles, diagnostic: p.diagnostic, angle: p.angle, note_google: p.note_google,
        avis_google: p.avis_google, site_actuel: p.site_actuel, ...(p.lien_maquette ? { lien_maquette: p.lien_maquette } : {}),
        ...(appeleCeJour && p.telephone ? { telephone: p.telephone } : {}) };
      if (appeleCeJour && p.telephone) bilan.numeros++;
      if (!sec) await appel('PATCH', `fiches_prospection?id=eq.${deja.id}`, champs);
      bilan.misesAJour++;
    } else {
      if (p.telephone) bilan.numeros++;
      if (!sec) await appel('POST', 'fiches_prospection', { ...p, statut: 'a-appeler', a_appeler_le: jour, source: 'soiree' });
      bilan.crees++;
    }
  }
  return bilan;
}

async function principal() {
  const args = process.argv.slice(2);
  const valeur = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : undefined; };
  const jour = valeur('--jour') || jourOuvreSuivant(jourParis());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) { console.error('--jour : AAAA-MM-JJ'); process.exit(2); }
  const env = exiger(['SUPABASE_URL', 'SUPABASE_CLE_SERVICE'], 'écrire les fiches du jour dans l’espace de prospection');
  const appel = client({ url: env.SUPABASE_URL, cle: env.SUPABASE_CLE_SERVICE });
  if (args.includes('--rappels')) {
    const r = await rappelsDuJour(appel, jour);
    console.log(`${r.length} fiche(s) déjà dans l'espace pour le ${jour} (numéro à relever) :`);
    for (const l of r) console.log(`  ${l.siren || '(sans SIREN)'}  ${l.nom}, ${l.commune || ''}  [${l.statut}]`);
    return;
  }
  const fichier = valeur('--fiches');
  if (!fichier) { console.error('Usage : --rappels | --fiches <fichier.json> [--jour AAAA-MM-JJ] [--sec]'); process.exit(2); }
  const entrees = JSON.parse(readFileSync(fichier, 'utf8'));
  if (!Array.isArray(entrees)) { console.error('Le fichier doit contenir une liste de fiches.'); process.exit(2); }
  const b = await verserFiches(appel, entrees, jour, { sec: args.includes('--sec') });
  console.log(`${args.includes('--sec') ? '(à sec) ' : ''}Jour ${jour} : ${b.crees} fiche(s) créée(s), ${b.misesAJour} mise(s) à jour, ${b.numeros} numéro(s) du jour.`);
  for (const e of b.ecartees) console.log(`  écartée : ${e}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  principal().catch((e) => { console.error(e.message); process.exit(1); });
}
