#!/usr/bin/env node
// Essai de la fonction Edge « inscription » (supabase/functions/inscription/
// logique.ts), sans réseau : un faux dépôt en mémoire refait ce que font la
// base (lien réservé d'un coup, un seul gagnant) et les comptes Supabase
// (une adresse, un compte).
//
//   node scripts/essai-inscription.mjs                 les contrôles
//   node scripts/essai-inscription.mjs --contre-essai  4 cassures de la
//        logique, posées une par une sur une copie : chacune doit rougir
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';

const SOURCE = join(RACINE, 'supabase', 'functions', 'inscription', 'logique.ts');
const J = (c) => c.repeat(64);

function fauxDepot() {
  const demain = new Date(Date.now() + 864e5).toISOString();
  const hier = new Date(Date.now() - 864e5).toISOString();
  const etat = {
    invitations: new Map([
      [J('a'), { siren: '111111111', genre: 'inscription', user_id: null, expire_le: demain, utilisee_le: null, nom_affiche: 'Façades Martin' }],
      [J('b'), { siren: '222222222', genre: 'inscription', user_id: null, expire_le: demain, utilisee_le: null, nom_affiche: 'Peintures Rossi' }],
      [J('c'), { siren: '333333333', genre: 'inscription', user_id: null, expire_le: hier, utilisee_le: null, nom_affiche: 'Toits Durand' }],
      [J('d'), { siren: '444444444', genre: 'reprise', user_id: 'u-ancien', expire_le: demain, utilisee_le: null, nom_affiche: 'Enduits Leroy' }],
      [J('e'), { siren: '555555555', genre: 'inscription', user_id: null, expire_le: demain, utilisee_le: null, nom_affiche: 'Crépis Blanc' }],
    ]),
    comptes: new Map([['u-ancien', { courriel: 'leroy@exemple.fr', mdp: 'ancien-mot' }]]),
    membres: [{ user_id: 'u-ancien', siren: '444444444' }],
    panne: false,
  };
  let n = 0;
  const depot = {
    async lire(j) { const i = etat.invitations.get(j); return i ? { ...i } : null; },
    async reserver(j) {
      await new Promise((r) => setTimeout(r, 5)); // deux envois qui se croisent
      const i = etat.invitations.get(j);
      if (!i || i.utilisee_le) return false;
      i.utilisee_le = new Date().toISOString();
      return true;
    },
    async liberer(j) { etat.invitations.get(j).utilisee_le = null; },
    async creerCompte(courriel, mdp) {
      if (etat.panne) throw new Error('panne simulée');
      if ([...etat.comptes.values()].some((c) => c.courriel === courriel)) return { existe: true };
      const id = `u-${++n}`;
      etat.comptes.set(id, { courriel, mdp });
      return { id };
    },
    async changerMotDePasse(id, mdp) { const c = etat.comptes.get(id); c.mdp = mdp; return { courriel: c.courriel }; },
    async courrielDe(id) { return etat.comptes.get(id)?.courriel ?? null; },
    async rattacher(id, siren, j) { etat.membres.push({ user_id: id, siren }); etat.invitations.get(j).user_id = id; },
  };
  return { depot, etat };
}

async function controles(fichier, { silencieux = false } = {}) {
  const { traiter } = await import(pathToFileURL(fichier).href + `?v=${Math.random()}`);
  let fautes = 0, total = 0;
  const ok = (c, quoi, detail = '') => { total++; if (!c) fautes++; if (!silencieux) console.log(`${c ? 'ok   ' : 'FAUTE'}  ${quoi}${!c && detail ? ` (${detail})` : ''}`); };
  const { depot, etat } = fauxDepot();
  const MDP = 'echafaudage13';
  const sansSiren = (r) => !JSON.stringify(r.corps).match(/\d{9}/);

  let r = await traiter({ action: 'lire', jeton: J('a') }, depot);
  ok(r.statut === 200 && r.corps.entreprise === 'Façades Martin' && r.corps.genre === 'inscription', 'le lien ouvre l’inscription au nom de l’entreprise', JSON.stringify(r));
  ok(sansSiren(r), 'la réponse ne porte pas le SIREN');
  r = await traiter({ action: 'lire', jeton: 'abc' }, depot);
  ok(r.statut === 404 && r.corps.ok === false, 'jeton mal formé : refusé');
  r = await traiter({ action: 'lire', jeton: J('f') }, depot);
  ok(r.statut === 404, 'jeton inconnu : refusé');
  r = await traiter({ action: 'lire', jeton: J('c') }, depot);
  ok(r.statut === 410 && /expiré/.test(r.corps.erreur), 'lien expiré : refusé', JSON.stringify(r));

  r = await traiter({ action: 'inscrire', jeton: J('a'), courriel: 'martin@exemple.fr', motDePasse: 'court' }, depot);
  ok(r.statut === 400 && /8 caractères/.test(r.corps.erreur), 'mot de passe de moins de 8 caractères : refusé');
  ok(!etat.invitations.get(J('a')).utilisee_le, 'un refus ne consomme pas le lien');
  r = await traiter({ action: 'inscrire', jeton: J('a'), courriel: 'pas-une-adresse', motDePasse: MDP }, depot);
  ok(r.statut === 400 && /invalide/.test(r.corps.erreur), 'adresse invalide : refusée');

  r = await traiter({ action: 'inscrire', jeton: J('a'), courriel: ' Martin@Exemple.fr ', motDePasse: MDP }, depot);
  const compte = [...etat.comptes.entries()].find(([, c]) => c.courriel === 'martin@exemple.fr');
  ok(r.statut === 200 && r.corps.courriel === 'martin@exemple.fr', 'inscription : compte créé, adresse en minuscules', JSON.stringify(r));
  ok(compte && etat.membres.some((m) => m.user_id === compte[0] && m.siren === '111111111'), 'le compte est rattaché à l’entreprise du lien, et à elle seule');
  ok(compte && compte[1].mdp === MDP, 'le mot de passe choisi est celui du compte');
  ok(etat.invitations.get(J('a')).utilisee_le && etat.invitations.get(J('a')).user_id === compte?.[0], 'le lien est marqué utilisé, avec le compte');

  r = await traiter({ action: 'inscrire', jeton: J('a'), courriel: 'autre@exemple.fr', motDePasse: MDP }, depot);
  ok(r.statut === 410 && /déjà servi/.test(r.corps.erreur), 'un lien qui a servi est refusé', JSON.stringify(r));

  r = await traiter({ action: 'inscrire', jeton: J('b'), courriel: 'martin@exemple.fr', motDePasse: MDP }, depot);
  ok(r.statut === 409 && /déjà un compte/.test(r.corps.erreur), 'une adresse déjà inscrite chez une autre entreprise est refusée', JSON.stringify(r));
  ok(!etat.membres.some((m) => m.siren === '222222222'), 'et n’est pas rattachée à la seconde entreprise');
  ok(!etat.invitations.get(J('b')).utilisee_le, 'le lien de la seconde entreprise reste valable');

  r = await traiter({ action: 'inscrire', jeton: J('d'), courriel: 'x@exemple.fr', motDePasse: MDP }, depot);
  ok(r.statut === 400 && !etat.invitations.get(J('d')).utilisee_le, 'un lien de reprise ne crée pas de compte');

  const [a, b] = await Promise.all([
    traiter({ action: 'inscrire', jeton: J('e'), courriel: 'un@exemple.fr', motDePasse: MDP }, depot),
    traiter({ action: 'inscrire', jeton: J('e'), courriel: 'deux@exemple.fr', motDePasse: MDP }, depot),
  ]);
  ok([a.statut, b.statut].sort().join() === '200,410' && etat.membres.filter((m) => m.siren === '555555555').length === 1,
    'deux envois du même lien en même temps : un seul compte', `${a.statut} ${b.statut}`);

  r = await traiter({ action: 'lire', jeton: J('d') }, depot);
  ok(r.statut === 200 && r.corps.genre === 'reprise' && r.corps.courriel === 'leroy@exemple.fr', 'un lien de reprise montre l’adresse du compte', JSON.stringify(r));
  r = await traiter({ action: 'reprendre', jeton: J('d'), motDePasse: 'nouveau-mot-2026' }, depot);
  ok(r.statut === 200 && etat.comptes.get('u-ancien').mdp === 'nouveau-mot-2026' && r.corps.courriel === 'leroy@exemple.fr', 'reprise : nouveau mot de passe posé');
  r = await traiter({ action: 'reprendre', jeton: J('d'), motDePasse: 'encore-un-autre' }, depot);
  ok(r.statut === 410 && etat.comptes.get('u-ancien').mdp === 'nouveau-mot-2026', 'un lien de reprise ne sert qu’une fois');

  // une panne au milieu ne brûle pas le lien
  const p = fauxDepot(); p.etat.panne = true;
  const lance = await traiter({ action: 'inscrire', jeton: J('b'), courriel: 'rossi@exemple.fr', motDePasse: MDP }, p.depot).then(() => false, () => true);
  ok(lance && !p.etat.invitations.get(J('b')).utilisee_le, 'une panne pendant la création rend le lien');

  r = await traiter({ action: 'effacer', jeton: J('b'), motDePasse: MDP }, depot);
  ok(r.statut === 400, 'action inconnue : refusée');
  if (!silencieux) console.log(`\n${total} contrôles, ${fautes} faute(s).`);
  return fautes;
}

const CASSURES = [
  ['l’expiration n’est plus lue', "if (Date.parse(inv.expire_le) < Date.now())", 'if (false)'],
  ['le lien n’est plus réservé', 'if (!(await depot.reserver(jeton))) return non(410, \'Ce lien a déjà servi. Connectez-vous', 'if (false) return non(410, \'Ce lien a déjà servi. Connectez-vous'],
  ['une adresse prise ne rend pas le lien', "        await depot.liberer(jeton);\n        return non(409", '        return non(409'],
  ['la réponse montre le SIREN', "{ ok: true, genre: inv.genre, entreprise: inv.nom_affiche }", '{ ok: true, genre: inv.genre, entreprise: inv.nom_affiche, siren: inv.siren }'],
];

// Contre la vraie fonction, sur le compte d'essai seulement (SIREN 000000000,
// adresse SITO_COMPTE_ESSAI_COURRIEL du .env). Le jeton vient de la base :
//   select public.creer_invitation('000000000');             (première fois)
//   select public.creer_invitation('000000000', 'reprise');  (les suivantes)
// par l'outil MCP execute_sql. La clé publique (celle de l'app, publique par
// nature) arrive par SITO_CLE_PUBLIQUE. Le mot de passe est tiré au hasard et
// jamais affiché : la fois suivante, un lien de reprise en pose un autre.
async function reel(jeton) {
  const { exiger } = await import('./env.mjs');
  const env = exiger(['SUPABASE_URL', 'SITO_COMPTE_ESSAI_COURRIEL'], 'essayer l’inscription sur la vraie base');
  const cle = process.env.SITO_CLE_PUBLIQUE;
  if (!cle) { console.error('SITO_CLE_PUBLIQUE manque (clé publique de l’app, outil MCP get_publishable_keys).'); return 3; }
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const courriel = env.SITO_COMPTE_ESSAI_COURRIEL.toLowerCase();
  const { randomBytes } = await import('node:crypto');
  const mdp = randomBytes(18).toString('base64url');
  const appel = async (chemin, corps, entetes = {}) => {
    const r = await fetch(base + chemin, { method: corps ? 'POST' : 'GET', headers: { apikey: cle, 'content-type': 'application/json', ...entetes }, body: corps ? JSON.stringify(corps) : undefined });
    return { statut: r.status, corps: await r.json().catch(() => null) };
  };
  let fautes = 0, total = 0;
  const ok = (c, quoi, detail = '') => { total++; if (!c) fautes++; console.log(`${c ? 'ok   ' : 'FAUTE'}  ${quoi}${!c && detail ? ` (${detail})` : ''}`); };

  const lu = await appel('/functions/v1/inscription', { action: 'lire', jeton });
  ok(lu.statut === 200 && lu.corps?.ok, `le lien s’ouvre (${lu.corps?.genre}, ${lu.corps?.entreprise})`, JSON.stringify(lu));
  if (lu.statut !== 200) return 1;
  const fait = lu.corps.genre === 'inscription'
    ? await appel('/functions/v1/inscription', { action: 'inscrire', jeton, courriel, motDePasse: mdp })
    : await appel('/functions/v1/inscription', { action: 'reprendre', jeton, motDePasse: mdp });
  ok(fait.statut === 200 && fait.corps?.courriel === courriel, `${lu.corps.genre} faite pour le compte d’essai`, JSON.stringify(fait));
  const session = await appel('/auth/v1/token?grant_type=password', { email: courriel, password: mdp });
  ok(session.statut === 200 && session.corps?.access_token, 'connexion par e-mail et mot de passe, sans code ni e-mail de confirmation', String(session.statut));
  const faux = await appel('/auth/v1/token?grant_type=password', { email: courriel, password: mdp + 'x' });
  ok(faux.statut === 400 && !faux.corps?.access_token, 'mauvais mot de passe refusé', String(faux.statut));
  if (session.corps?.access_token) {
    const m = await appel('/rest/v1/membres?select=siren', null, { authorization: `Bearer ${session.corps.access_token}` });
    ok(m.statut === 200 && m.corps?.length === 1 && m.corps[0].siren === '000000000', 'le compte ne voit que l’entreprise d’essai', JSON.stringify(m.corps));
  }
  const encore = await appel('/functions/v1/inscription', { action: lu.corps.genre === 'inscription' ? 'inscrire' : 'reprendre', jeton, courriel, motDePasse: mdp });
  ok(encore.statut === 410, 'le même lien, une seconde fois : refusé', String(encore.statut));
  console.log(`\n${total} contrôles, ${fautes} faute(s).`);
  return fautes ? 1 : 0;
}

const iReel = process.argv.indexOf('--reel');
if (iReel >= 0) {
  process.exitCode = await reel(process.argv[iReel + 1]);
} else if (process.argv.includes('--contre-essai')) {
  const d = mkdtempSync(join(tmpdir(), 'sito-inscription-casse-'));
  let attrapees = 0;
  const texte = readFileSync(SOURCE, 'utf8');
  for (const [nom, avant, apres] of CASSURES) {
    if (!texte.includes(avant)) { console.log(`FAUTE  cassure « ${nom} » : texte introuvable`); continue; }
    const f = join(d, `logique-${attrapees}-${Math.random().toString(36).slice(2, 6)}.ts`);
    writeFileSync(f, texte.replace(avant, apres));
    const fautes = await controles(f, { silencieux: true });
    console.log(`${fautes ? 'attrapée' : 'MANQUÉE '}  ${nom} (${fautes} faute(s))`);
    if (fautes) attrapees++;
  }
  rmSync(d, { recursive: true, force: true });
  console.log(`\n${attrapees}/${CASSURES.length} cassures attrapées.`);
  process.exit(attrapees === CASSURES.length ? 0 : 1);
} else {
  process.exit(await controles(SOURCE) ? 1 : 0);
}
