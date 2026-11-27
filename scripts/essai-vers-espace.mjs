// Essai de scripts/prospection/vers-espace.mjs (T71) sur une fausse base
// PostgREST en mémoire : rien ne part sur le réseau, aucune clé n'est lue.
// Contre-essai (--contre-essai) : des versions cassées de la règle doivent
// faire rougir l'essai.
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ICI = fileURLToPath(new URL('./prospection/vers-espace.mjs', import.meta.url));
let nettoyer, verserFiches, rappelsDuJour, client, jourOuvreSuivant;
async function charger(chemin) { ({ nettoyer, verserFiches, rappelsDuJour, client, jourOuvreSuivant } = await import(pathToFileURL(chemin).href)); }

let fautes = 0, essais = 0;
const ok = (c, quoi, detail = '') => { essais++; if (c) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` : ${detail}` : ''}`); } };

// Une fausse table fiches_prospection derrière un faux fetch.
function fausseBase(lignes) {
  const t = lignes.map((l, i) => ({ id: `id${i}`, telephone: null, notes: null, ...l }));
  const appels = [];
  const fetch = async (url, { method, body }) => {
    const u = new URL(url);
    appels.push({ method, path: u.pathname, query: u.search });
    const p = Object.fromEntries(u.searchParams);
    let r = t;
    if (p.siren?.startsWith('in.(')) { const s = p.siren.slice(4, -1).split(','); r = r.filter((x) => s.includes(x.siren)); }
    if (p.id?.startsWith('eq.')) r = r.filter((x) => x.id === p.id.slice(3));
    if (p.a_appeler_le?.startsWith('lte.')) r = r.filter((x) => x.a_appeler_le && x.a_appeler_le <= p.a_appeler_le.slice(4));
    if (p.statut?.startsWith('not.in.(')) { const s = p.statut.slice(8, -1).split(','); r = r.filter((x) => !s.includes(x.statut)); }
    let sortie = r;
    if (method === 'POST') { const n = { id: `id${t.length}`, ...JSON.parse(body) }; t.push(n); sortie = [n]; }
    if (method === 'PATCH') { const c = JSON.parse(body); r.forEach((x) => Object.assign(x, c)); }
    return { ok: true, status: 200, text: async () => JSON.stringify(sortie) };
  };
  return { t, appels, appel: client({ url: 'https://faux.supabase.co', cle: 'cle-essai', fetch }) };
}

const JOUR = '2026-11-30';
const entree = (siren, x = {}) => ({ siren, nom: `Entreprise ${siren}`, metier: 'Ravalement', commune: 'Aubagne', telephone: '06 39 98 00 01',
  points_forts: [{ sujet: 'Avis', texte: '4,8 sur 30' }], points_faibles: [{ sujet: 'Site', texte: 'Aucun site' }], angle: 'Pas de site.', note_google: 4.8, avis_google: 30, ...x });

async function essai() {
  // nettoyer
  ok(nettoyer(entree('123456789')).fiche?.telephone === '06 39 98 00 01', 'un numéro est remis au format 06 xx xx xx xx');
  ok(nettoyer(entree('123456789', { telephone: '+33639980001' })).fiche?.telephone === '06 39 98 00 01', 'un +33 devient 06');
  ok(!!nettoyer(entree('123456789', { telephone: '12' })).erreur, 'un numéro illisible écarte la fiche');
  ok(!!nettoyer(entree('12345', {})).erreur, 'un SIREN faux écarte la fiche');
  ok(!!nettoyer(entree('123456789', { lien_maquette: 'http://x.fr' })).erreur, 'un lien de maquette sans https écarte la fiche');
  ok(!!nettoyer(entree('123456789', { note_google: 7 })).erreur, 'une note Google hors de 0 à 5 écarte la fiche');
  ok(nettoyer(entree('123456789', { points_forts: [{ sujet: 'a' }, 'x', { sujet: 'b', texte: 'c' }] })).fiche.points_forts.length === 1, 'un constat mal formé est retiré');
  ok(jourOuvreSuivant('2026-11-27') === '2026-11-30', 'le jour ouvré après un vendredi est le lundi');
  const dg = nettoyer(entree('123456789', { diagnostic: { resume: 'Créée en 2014', presence: [{ canal: 'Site', etat: 'absent', detail: 'aucun' }, { canal: 'X', etat: 'super' }],
    questions: ['Qui fait vos devis ?', 4], objections: [{ objection: 'Trop cher', reponse: '80 € par mois' }, { objection: 'sans réponse' }], pirate: 'x' } })).fiche.diagnostic;
  ok(dg.resume === 'Créée en 2014' && dg.presence.length === 1 && dg.questions.length === 1 && dg.objections.length === 1 && !('pirate' in dg),
    'l’analyse ne garde que les champs connus et bien formés', JSON.stringify(dg));

  // verser
  const b = fausseBase([
    { siren: '111111111', nom: 'Déjà refusé', statut: 'refuse', a_appeler_le: null },
    { siren: '222222222', nom: 'Rappel lundi', statut: 'a-rappeler', a_appeler_le: JOUR, notes: 'Rappeler après 10 h' },
    { siren: '333333333', nom: 'Rappel plus tard', statut: 'a-rappeler', a_appeler_le: '2026-12-10' },
  ]);
  const r = await verserFiches(b.appel, [entree('444444444'), entree('111111111'), entree('222222222', { telephone: '06 39 98 00 22' }),
    entree('333333333', { telephone: '06 39 98 00 33' }), entree('444444444'), { nom: 'sans siren' }], JOUR);
  ok(r.crees === 1, 'une nouvelle fiche est créée', JSON.stringify(r));
  const nouvelle = b.t.find((x) => x.siren === '444444444');
  ok(nouvelle?.a_appeler_le === JOUR && nouvelle.statut === 'a-appeler' && nouvelle.source === 'soiree', 'elle est à appeler le jour donné, source « soiree »');
  ok(nouvelle?.telephone === '06 39 98 00 01', 'son numéro du jour est gardé');
  ok(b.t.find((x) => x.siren === '111111111').telephone === null && r.ecartees.some((e) => /refuse/.test(e)), 'un refusé ne revient jamais');
  const rappel = b.t.find((x) => x.siren === '222222222');
  ok(rappel.statut === 'a-rappeler' && rappel.notes === 'Rappeler après 10 h', 'un rappel garde son statut et les notes de Fabrice');
  ok(rappel.telephone === '06 39 98 00 22', 'un rappel du jour reçoit son numéro');
  const plusTard = b.t.find((x) => x.siren === '333333333');
  ok(plusTard.telephone === null, 'un rappel d’un autre jour ne reçoit pas de numéro');
  ok(plusTard.angle === 'Pas de site.', 'son diagnostic est quand même mis à jour');
  ok(r.ecartees.some((e) => /double/.test(e)) && r.ecartees.some((e) => /SIREN absent/.test(e)), 'doublon et fiche sans SIREN sont écartés avec leur raison');
  ok(r.numeros === 2, 'deux numéros du jour comptés (nouveau et rappel du jour)', `${r.numeros}`);

  // à sec : rien n'est écrit
  const b2 = fausseBase([]);
  const r2 = await verserFiches(b2.appel, [entree('555555555')], JOUR, { sec: true });
  ok(r2.crees === 1 && b2.t.length === 0 && b2.appels.every((a) => a.method === 'GET'), 'à sec, rien n’est écrit');

  // rappels du jour
  const rap = await rappelsDuJour(b.appel, JOUR);
  ok(rap.some((x) => x.siren === '222222222') && !rap.some((x) => x.siren === '333333333') && !rap.some((x) => x.siren === '111111111'),
    'la liste des rappels du jour ne prend que ce qui est dû et appelable');
}

if (process.argv.includes('--contre-essai')) {
  // Des copies cassées du script, une par une : l'essai doit rougir sur chacune.
  const source = await readFile(ICI, 'utf8');
  const CASSES = [
    { nom: 'numéro écrit même hors du jour', de: '...(appeleCeJour && p.telephone ? { telephone: p.telephone } : {})', par: '...(p.telephone ? { telephone: p.telephone } : {})' },
    { nom: 'un refusé revient', de: "if (deja && HORS_LISTE.includes(deja.statut))", par: 'if (false)' },
    { nom: 'à sec écrit quand même', de: "if (!sec) await appel('POST'", par: "await appel('POST'" },
  ];
  let bon = 0;
  for (const c of CASSES) {
    if (!source.includes(c.de)) { console.log(`contre-essai « ${c.nom} » : motif introuvable (FAUTE)`); continue; }
    const dossier = await mkdtemp(join(tmpdir(), 'sito-vers-espace-'));
    const env = join(dossier, '..', 'env.mjs');
    await writeFile(env, 'export const exiger = () => ({});\n').catch(() => {});
    const copie = join(dossier, 'vers-espace.mjs');
    await writeFile(copie, source.replace(c.de, c.par).replace("from '../" + "env.mjs'", `from '${pathToFileURL(env).href}'`));
    await charger(copie);
    fautes = 0; essais = 0;
    const log = console.log; console.log = () => {};
    try { await essai(); } catch { fautes++; }
    console.log = log;
    await rm(dossier, { recursive: true, force: true });
    if (fautes) bon++;
    console.log(`contre-essai « ${c.nom} » : ${fautes ? `${fautes} faute(s), l'essai rougit (juste)` : 'reste vert (FAUTE)'}`);
  }
  process.exit(bon === CASSES.length ? 0 : 1);
}
await charger(ICI);
await essai();
console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exit(fautes ? 1 : 0);
