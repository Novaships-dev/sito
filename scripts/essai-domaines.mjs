#!/usr/bin/env node
// Essai des domaines contre des faux : les deux clients (T19), Gandi v5
// (`supabase/functions/_shared/gandi.mjs`, faux : `faux-gandi.mjs`) et
// Cloudflare for SaaS (`_shared/cloudflare-saas.mjs`, faux :
// `faux-cloudflare-saas.mjs`), et ce que demande l'écran Mon adresse (T20,
// `_shared/domaines.mjs`, avec un faux dépôt `adresses`). Aucun réseau, aucune clé.
//
// Ce qu'il mesure, sur l'état des faux (jamais sur ce que le client dit) :
//   Gandi : un nom libre se dit libre avec son prix, un nom pris non ; un
//   achat à blanc ne crée rien ; un achat réel sans confirmation de l'artisan
//   est refusé et ne part pas ; avec elle, le domaine est au nom de l'artisan
//   (raison sociale, SIREN, téléphone EPP) ; un titulaire incomplet ne part
//   pas ; le renouvellement allonge l'échéance d'un an ; le code de transfert
//   vient verrou levé ; la redirection va du domaine nu vers www, en 301 et
//   en https ; un mauvais jeton est refusé et le jeton ne paraît pas dans
//   l'erreur.
//   Cloudflare : un hostname se crée en attente, avec la preuve à poser ;
//   validé, l'adresse passe active ; sans certificat, elle reste en attente ;
//   effacé au bout de 7 jours, `suivre()` le recrée et range le nouvel
//   identifiant ; un hostname déjà présent est repris, pas doublé ; un échec
//   de validation donne `echec` avec son motif ; une adresse retirée n'est
//   pas touchée.
//   Mon adresse : une extension hors .fr/.com n'est pas cherchée ; sans
//   abonnement en cours, rien n'est acheté ; un achat écrit la ligne avant de
//   payer, pointe www, redirige le domaine nu, crée le hostname et range
//   l'échéance ; un refus du registre laisse la ligne en échec, sans hostname ;
//   un second domaine est refusé ; un domaine pris ailleurs n'est pas branché ;
//   brancher donne le CNAME ; vérifier passe l'adresse active.
//
//   node scripts/essai-domaines.mjs
//   node scripts/essai-domaines.mjs --contre-essai   (copies cassées des deux
//        modules : chacune doit faire rougir l'essai)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';
import { fauxGandi } from './faux-gandi.mjs';
import { fauxCloudflareSaas } from './faux-cloudflare-saas.mjs';

const ARTISAN = {
  raisonSociale: 'Façades Essai', siren: '480 423 623', prenom: 'Jeanne', nom: 'Essai',
  courriel: 'jeanne@essai.fr', adresse: '10 rue du Test', codePostal: '13001', commune: 'Marseille',
  telephone: '06 12 34 56 78',
};

async function scenario(gandiMod, saasMod, domMod) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const refuse = async (f) => { try { await f(); return null; } catch (e) { return e; } };

  // ---------------------------------------------------------------- Gandi
  console.log('Gandi');
  const fg = fauxGandi({ pris: ['pris.fr'] });
  const g = gandiMod.clientGandi({ jeton: fg.jeton, bacASable: false, fetch: fg.fetch, api: 'http://faux-gandi/v5' });

  const libre = await g.verifier('facades-essai.fr');
  ok(libre.disponible === true && libre.prix?.ttc === 12 && libre.prix?.devise === 'EUR', 'un nom libre : disponible, avec son prix', JSON.stringify(libre));
  const pris = await g.verifier('pris.fr');
  ok(pris.disponible === false && pris.statut === 'unavailable', 'un nom pris : indisponible', JSON.stringify(pris));
  ok(Boolean(await refuse(() => g.verifier('Pas un nom'))), 'un nom mal formé est refusé avant tout appel');

  await g.acheter({ fqdn: 'facades-essai.fr', titulaire: ARTISAN, essai: true });
  ok(!fg.registre.has('facades-essai.fr'), 'un achat à blanc ne crée rien chez Gandi');
  ok(fg.appels.some((a) => a.methode === 'POST' && a.chemin === '/v5/domain/domains' && a.essai), 'l achat à blanc porte Dry-Run');

  const avant = fg.appels.length;
  const sansConf = await refuse(() => g.acheter({ fqdn: 'facades-essai.fr', titulaire: ARTISAN }));
  ok(Boolean(sansConf) && fg.appels.length === avant && !fg.registre.has('facades-essai.fr'),
    'un achat réel sans confirmation de l artisan est refusé, et rien ne part', sansConf?.message);

  const incomplet = await refuse(() => g.acheter({ fqdn: 'facades-essai.fr', titulaire: { ...ARTISAN, courriel: '' }, confirmation: 'c-1' }));
  ok(Boolean(incomplet) && !fg.registre.has('facades-essai.fr'), 'un titulaire incomplet ne part pas', incomplet?.message);

  await g.acheter({ fqdn: 'facades-essai.fr', titulaire: ARTISAN, confirmation: 'c-1' });
  const d = fg.registre.get('facades-essai.fr');
  ok(Boolean(d), 'avec la confirmation, le domaine est acheté');
  ok(d?.owner?.type === 1 && d?.owner?.orgname === 'Façades Essai' && d?.owner?.siren === '480423623',
    'le titulaire est l entreprise de l artisan (raison sociale, SIREN)', JSON.stringify(d?.owner));
  ok(d?.owner?.phone === '+33.612345678' && d?.owner?.given === 'Jeanne' && d?.owner?.country === 'FR',
    'téléphone sous forme EPP, nom et pays', JSON.stringify(d?.owner));
  ok(Boolean(await refuse(() => g.acheter({ fqdn: 'pris.fr', titulaire: ARTISAN, confirmation: 'c-2' }))), 'un nom pris ne s achète pas');

  const finAvant = d.fin;
  await g.renouveler({ fqdn: 'facades-essai.fr', essai: true });
  ok(d.fin === finAvant, 'un renouvellement à blanc ne change rien');
  ok(Boolean(await refuse(() => g.renouveler({ fqdn: 'facades-essai.fr' }))) && d.fin === finAvant, 'un renouvellement réel sans confirmation est refusé');
  await g.renouveler({ fqdn: 'facades-essai.fr', confirmation: 'c-3' });
  ok(Number(d.fin.slice(0, 4)) === Number(finAvant.slice(0, 4)) + 1, 'le renouvellement allonge l échéance d un an', `${finAvant} → ${d.fin}`);
  ok(await g.echeance('facades-essai.fr') === d.fin, 'l échéance relue chez Gandi');

  const code = await g.codeTransfert('facades-essai.fr');
  ok(d.verrou === false && code.code === d.authinfo, 'le code de transfert, verrou levé', JSON.stringify(code));

  const redir = await g.redirigerVersWww('facades-essai.fr');
  const r = fg.redirections.get('facades-essai.fr')?.get('facades-essai.fr');
  ok(r?.url === 'www.facades-essai.fr' && r?.type === 'http301' && r?.protocol === 'httpsonly',
    'redirection du domaine nu vers www, 301, https seulement', JSON.stringify(r));
  ok(redir.vers === 'https://www.facades-essai.fr', 'la redirection rendue');
  await g.redirigerVersWww('facades-essai.fr');
  ok(fg.redirections.get('facades-essai.fr').size === 1, 'refaire la redirection ne la double pas');
  ok(Boolean(await refuse(() => g.codeTransfert('pris.fr'))), 'pas de code pour un domaine qui n est pas à nous');

  const mauvais = gandiMod.clientGandi({ jeton: 'mauvais-jeton-secret', fetch: fg.fetch, api: 'http://faux-gandi/v5' });
  const e = await refuse(() => mauvais.verifier('facades-essai.fr'));
  ok(Boolean(e) && e.statut === 401 && !e.message.includes('mauvais-jeton-secret'), 'un mauvais jeton est refusé, et ne paraît pas dans l erreur', e?.message);
  ok(gandiMod.clientGandi({ jeton: 'x' }).base.includes('sandbox'), 'sans réglage, le client parle au bac à sable');

  // ----------------------------------------------------------- Cloudflare
  console.log('Cloudflare for SaaS');
  const fc = fauxCloudflareSaas();
  const s = saasMod.clientSaas({ zone: fc.zone, jeton: fc.jeton, fetch: fc.fetch, api: 'http://faux-cloudflare/client/v4' });

  const adresse = { hote: 'www.facades-essai.fr', etat: 'en_attente', cloudflare_id: null };
  let maj = await s.suivre(adresse);
  ok(maj?.etat === 'en_attente' && fc.hotes.has(maj?.cloudflare_id), 'un nouveau domaine : hostname créé, en attente', JSON.stringify(maj));
  const cree = await s.etat(maj.cloudflare_id);
  ok(cree?.preuve?.nom === '_cf-custom-hostname.www.facades-essai.fr', 'la preuve de propriété à poser est rendue', JSON.stringify(cree?.preuve));
  Object.assign(adresse, maj);

  fc.valider('www.facades-essai.fr', { certificat: false });
  maj = await s.suivre(adresse);
  ok(maj.etat === 'en_attente', 'validé mais sans certificat : encore en attente', JSON.stringify(maj));
  fc.valider('www.facades-essai.fr');
  maj = await s.suivre(adresse);
  ok(maj.etat === 'active' && maj.cloudflare_id === adresse.cloudflare_id, 'certificat émis : l adresse passe active, même identifiant');

  const a2 = { hote: 'www.lent.fr', etat: 'en_attente', cloudflare_id: null };
  Object.assign(a2, await s.suivre(a2));
  const ancien = a2.cloudflare_id;
  fc.expirer('www.lent.fr');
  maj = await s.suivre(a2);
  ok(Boolean(maj.cloudflare_id) && maj.cloudflare_id !== ancien && fc.hotes.has(maj.cloudflare_id),
    'effacé au bout de 7 jours : recréé, nouvel identifiant rangé', `${ancien} → ${maj?.cloudflare_id}`);
  ok(maj.etat === 'en_attente' && /7 jours/.test(maj.motif || ''), 'le motif dit pourquoi il a été recréé', maj.motif);

  const dejaLa = await s.creer('www.deja.fr');
  const a3 = { hote: 'www.deja.fr', etat: 'en_attente', cloudflare_id: null };
  maj = await s.suivre(a3);
  ok(maj.cloudflare_id === dejaLa.id && [...fc.hotes.values()].filter((x) => x.hostname === 'www.deja.fr').length === 1,
    'un hostname déjà présent est repris, pas doublé', JSON.stringify(maj));

  fc.echouer('www.deja.fr', 'CNAME absent');
  maj = await s.suivre({ ...a3, ...maj });
  ok(maj.etat === 'echec' && maj.motif === 'CNAME absent', 'validation échouée : echec, avec son motif', JSON.stringify(maj));

  const appelsAvant = fc.appels.length;
  ok(await s.suivre({ hote: 'www.parti.fr', etat: 'retiree', cloudflare_id: null }) === null && fc.appels.length === appelsAvant,
    'une adresse retirée n est pas touchée');
  ok(Boolean(await refuse(() => s.creer('pas un hôte'))), 'un hôte mal formé est refusé');
  const e2 = await refuse(() => saasMod.clientSaas({ zone: 'autre-zone', jeton: fc.jeton, fetch: fc.fetch, api: 'http://faux-cloudflare/client/v4' }).creer('www.x.fr'));
  ok(Boolean(e2), 'une autre zone est refusée', e2?.message);

  // ---------------------------------------------------------- Mon adresse
  console.log('Mon adresse (domaines.mjs)');
  const fg2 = fauxGandi({ pris: ['deja-pris.fr'] });
  const fc2 = fauxCloudflareSaas();
  const g2 = gandiMod.clientGandi({ jeton: fg2.jeton, bacASable: false, fetch: fg2.fetch, api: 'http://faux-gandi/v5' });
  const s2 = saasMod.clientSaas({ zone: fc2.zone, jeton: fc2.jeton, fetch: fc2.fetch, api: 'http://faux-cloudflare/client/v4' });
  const lignes = [{ site_id: 'site-autre', hote: 'www.chez-voisin.fr', genre: 'existante', principale: false, etat: 'active' }];
  const depot = {
    async adresses(id) { return lignes.filter((l) => l.site_id === id).map((l) => ({ ...l })); },
    async hoteAilleurs(h, id) { return lignes.some((l) => l.hote === h && l.site_id !== id && l.etat !== 'retiree'); },
    async ajouter(l) { if (lignes.some((x) => x.hote === l.hote)) throw new Error('doublon'); lignes.push({ ...l }); },
    async maj(id, h, c) { Object.assign(lignes.find((l) => l.site_id === id && l.hote === h), c); },
  };
  const ctx = (etat) => ({ userId: 'u-1', courriel: 'jeanne@essai.fr', site: { id: 'site-1' }, abonnement: { etat },
    entreprise: { siren: '480423623', denomination: 'FAÇADES ESSAI', forme_juridique: '5710', adresse: '10 rue du Test', code_postal: '13001', commune: 'Marseille' },
    profil: { telephone: '0612345678', courriel: 'contact@facades-essai.fr' } });
  const T = (action, nom, extra = {}) => domMod.traiter({ action, nom, ctx: ctx('actif'), depot, gandi: g2, saas: s2, reglages: { cible: 'sites.sito-essai.fr' }, ...extra });
  const REP = { prenom: 'Jeanne', nom: 'Essai' };

  const ext = await T('chercher', 'facades-essai.de');
  ok(ext.ok && ext.disponible === false && /\.fr ou \.com/.test(ext.motif) && !fg2.appels.length, 'une extension hors .fr/.com : refusée sans appeler Gandi', JSON.stringify(ext));
  const lib = await T('chercher', 'https://www.Facades-Essai.fr/');
  ok(lib.ok && lib.hote === 'facades-essai.fr' && lib.disponible === true, 'chercher : le nom tapé est lu, libre', JSON.stringify(lib));
  ok((await T('chercher', 'deja-pris.fr')).disponible === false, 'chercher : un nom pris');
  ok((await T('chercher', 'pas un nom')).ok === false, 'un nom illisible : une phrase, pas un appel');

  const sansAbo = await domMod.traiter({ action: 'acheter', nom: 'facades-essai.fr', representant: REP, ctx: ctx('essai'), depot, gandi: g2, saas: s2, reglages: { cible: 'sites.sito-essai.fr' } });
  ok(!sansAbo.ok && sansAbo.statut === 402 && !fg2.registre.has('facades-essai.fr') && !lignes.some((l) => l.site_id === 'site-1'),
    'sans abonnement en cours : rien n est acheté ni écrit', JSON.stringify(sansAbo));
  ok((await T('acheter', 'facades-essai.fr', { representant: { prenom: 'Jeanne', nom: '' } })).ok === false, 'sans représentant : refusé');

  const achat = await T('acheter', 'facades-essai.fr', { representant: REP });
  const dom = fg2.registre.get('facades-essai.fr');
  const ligne = lignes.find((l) => l.hote === 'www.facades-essai.fr');
  ok(achat.ok && dom?.owner?.orgname === 'FAÇADES ESSAI' && dom?.owner?.given === 'Jeanne' && dom?.owner?.email === 'contact@facades-essai.fr',
    'acheté au nom de l entreprise, représentée par la personne indiquée', JSON.stringify(dom?.owner));
  ok(JSON.stringify(dom?.dns?.['www/CNAME']) === JSON.stringify(['sites.sito-essai.fr.']), 'www pointe vers la cible de Sitô (nom absolu)', JSON.stringify(dom?.dns));
  ok(fg2.redirections.get('facades-essai.fr')?.get('facades-essai.fr')?.url === 'www.facades-essai.fr', 'le domaine nu redirigé vers www');
  ok(ligne?.genre === 'achetee' && ligne?.etat === 'en_attente' && fc2.hotes.has(ligne?.cloudflare_id) && ligne?.echeance === dom?.fin && ligne?.motif === null,
    'ligne écrite : achetée, en attente, hostname et échéance rangés', JSON.stringify(ligne));
  const ordre = fg2.appels.findIndex((a) => a.methode === 'POST' && a.chemin === '/v5/domain/domains' && !a.essai);
  ok(ordre > -1 && achat.adresse?.hote === 'www.facades-essai.fr', 'l app reçoit l adresse www');
  ok((await T('acheter', 'second-domaine.fr', { representant: REP })).statut === 409, 'un second domaine pour le même site : refusé');

  // un refus du registre après l'écriture de la ligne
  const fg3 = fauxGandi({ pris: [] });
  const lignes3 = [];
  const depot3 = { ...depot, async adresses(id) { return lignes3.filter((l) => l.site_id === id); }, async hoteAilleurs() { return false; },
    async ajouter(l) { lignes3.push({ ...l }); }, async maj(id, h, c) { Object.assign(lignes3.find((l) => l.hote === h), c); } };
  const g3 = gandiMod.clientGandi({ jeton: fg3.jeton, bacASable: false, fetch: async (u, i) => (i?.method === 'POST' && String(u).endsWith('/domain/domains')
    ? new Response(JSON.stringify({ code: 400, message: 'Registry error', errors: [] }), { status: 400 }) : fg3.fetch(u, i)), api: 'http://faux-gandi/v5' });
  const fc3 = fauxCloudflareSaas();
  const s3 = saasMod.clientSaas({ zone: fc3.zone, jeton: fc3.jeton, fetch: fc3.fetch, api: 'http://faux-cloudflare/client/v4' });
  const refus = await domMod.traiter({ action: 'acheter', nom: 'refuse-par-registre.fr', representant: REP, ctx: ctx('actif'), depot: depot3, gandi: g3, saas: s3, reglages: { cible: 'sites.sito-essai.fr' } });
  ok(!refus.ok && lignes3[0]?.etat === 'echec' && /registre/.test(lignes3[0]?.motif || '') && fc3.hotes.size === 0,
    'refus du registre : la ligne passe en échec avec le motif, aucun hostname', JSON.stringify(lignes3[0]));

  ok((await T('brancher', 'chez-voisin.fr')).statut === 409, 'un domaine déjà branché sur un autre site : refusé');
  const br = await T('brancher', 'mon-ancien-site.com');
  ok(br.ok && br.cname?.nom === 'www' && br.cname?.valeur === 'sites.sito-essai.fr' && fc2.hotes.has(lignes.find((l) => l.hote === 'www.mon-ancien-site.com')?.cloudflare_id),
    'brancher : hostname créé, CNAME à poser rendu', JSON.stringify(br));
  fc2.valider('www.mon-ancien-site.com');
  const ve = await T('verifier', 'www.mon-ancien-site.com');
  ok(ve.ok && ve.adresse?.etat === 'active' && lignes.find((l) => l.hote === 'www.mon-ancien-site.com')?.etat === 'active', 'vérifier : l adresse passe active, en base aussi', JSON.stringify(ve));
  ok((await T('verifier', 'www.inconnu.fr')).statut === 404, 'vérifier une adresse qui n est pas à nous : refusé');

  return { fautes, essais };
}

// Une copie cassée peut lever en plein milieu : c'est une faute, pas un arrêt.
async function essayer(g, c, m) {
  try { return await scenario(g, c, m); } catch (e) { console.log(`  FAUTE l essai s arrête : ${e.message}`); return { fautes: 1, essais: 1 }; }
}

const DOSSIER = join(RACINE, 'supabase', 'functions', '_shared');
const mod = (f) => pathToFileURL(join(DOSSIER, f)).href;
if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await essayer(await import(mod('gandi.mjs')), await import(mod('cloudflare-saas.mjs')), await import(mod('domaines.mjs')));
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const lire = (f) => readFileSync(join(DOSSIER, f), 'utf8').replace(/from '\.\/([^']+)'/g, (_, r) => `from '${mod(r)}'`);
  const casses = [
    ['gandi.mjs', 'l achat à blanc oublie Dry-Run', (s) => s.replace("if (essai) entetes['Dry-Run'] = '1';", '')],
    ['gandi.mjs', 'l achat réel part sans confirmation', (s) => s.replace('if (!bacASable && !essai && !confirmation)', 'if (false)')],
    ['gandi.mjs', 'le verrou de transfert n est pas levé', (s) => s.replace('corps: { clientTransferProhibited: false }', 'corps: { clientTransferProhibited: true }')],
    ['gandi.mjs', 'le titulaire perd son SIREN', (s) => s.replace("...(t.siren ? { siren: String(t.siren).replace(/\\s/g, '') } : {}),", '')],
    ['cloudflare-saas.mjs', 'un hostname effacé n est pas recréé', (s) => s.replace("ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);\n        motif = 'recréé", "ch = { id: adresse.cloudflare_id, etat: 'en_attente', erreurs: [] };\n        motif = 'recréé")],
    ['cloudflare-saas.mjs', 'actif sans certificat', (s) => s.replace("if (s === 'active' && ssl === 'active') return 'active';", "if (s === 'active') return 'active';")],
    ['cloudflare-saas.mjs', 'un hostname présent est doublé', (s) => s.replace("} else if (!ch) {\n        ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);", "} else if (!ch) {\n        ch = await client.creer(adresse.hote);")],
    ['domaines.mjs', 'achat sans abonnement en cours', (s) => s.replace("if (ctx.abonnement?.etat !== 'actif')", 'if (false)')],
    ['domaines.mjs', 'la ligne n est pas écrite avant l achat', (s) => s.replace("registrar: 'gandi', motif: 'Achat en cours.' };\n  await depot.ajouter(ligne);", "registrar: 'gandi', motif: 'Achat en cours.' };")],
    ['domaines.mjs', 'toutes les extensions passent', (s) => s.replace("if (!EXTENSIONS_INCLUSES.includes(extension(nom)))\n      return", "if (false)\n      return")],
    ['domaines.mjs', 'un domaine d un autre site est branché', (s) => s.replace("&& !meme && await depot.hoteAilleurs(hote, ctx.site.id))", "&& false)")],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-domaines-casse-'));
  let justes = 0;
  try {
    for (const [i, [fichier, quoi, casser]] of casses.entries()) {
      const source = lire(fichier), cassee = casser(source);
      if (cassee === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}-${fichier}`);
      writeFileSync(f, cassee);
      console.log(`\n--- copie cassée (${fichier}) : ${quoi}`);
      const pick = async (nom) => (fichier === nom ? import(pathToFileURL(f).href) : import(mod(nom)));
      const { fautes } = await essayer(await pick('gandi.mjs'), await pick('cloudflare-saas.mjs'), await pick('domaines.mjs'));
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}
