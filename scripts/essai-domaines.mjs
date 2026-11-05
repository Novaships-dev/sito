#!/usr/bin/env node
// Essai des deux clients de domaines (T19) contre leurs faux : Gandi v5
// (`atelier/gandi.mjs`, faux : `faux-gandi.mjs`) et Cloudflare for SaaS
// (`atelier/cloudflare-saas.mjs`, faux : `faux-cloudflare-saas.mjs`).
// Aucun réseau, aucune clé.
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

async function scenario(gandiMod, saasMod) {
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

  return { fautes, essais };
}

// Une copie cassée peut lever en plein milieu : c'est une faute, pas un arrêt.
async function essayer(g, c) {
  try { return await scenario(g, c); } catch (e) { console.log(`  FAUTE l essai s arrête : ${e.message}`); return { fautes: 1, essais: 1 }; }
}

const mod = (f) => pathToFileURL(join(RACINE, 'atelier', f)).href;
if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await essayer(await import(mod('gandi.mjs')), await import(mod('cloudflare-saas.mjs')));
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const lire = (f) => readFileSync(join(RACINE, 'atelier', f), 'utf8');
  const casses = [
    ['gandi.mjs', 'l achat à blanc oublie Dry-Run', (s) => s.replace("if (essai) entetes['Dry-Run'] = '1';", '')],
    ['gandi.mjs', 'l achat réel part sans confirmation', (s) => s.replace('if (!bacASable && !essai && !confirmation)', 'if (false)')],
    ['gandi.mjs', 'le verrou de transfert n est pas levé', (s) => s.replace('corps: { clientTransferProhibited: false }', 'corps: { clientTransferProhibited: true }')],
    ['gandi.mjs', 'le titulaire perd son SIREN', (s) => s.replace("...(t.siren ? { siren: String(t.siren).replace(/\\s/g, '') } : {}),", '')],
    ['cloudflare-saas.mjs', 'un hostname effacé n est pas recréé', (s) => s.replace("ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);\n        motif = 'recréé", "ch = { id: adresse.cloudflare_id, etat: 'en_attente', erreurs: [] };\n        motif = 'recréé")],
    ['cloudflare-saas.mjs', 'actif sans certificat', (s) => s.replace("if (s === 'active' && ssl === 'active') return 'active';", "if (s === 'active') return 'active';")],
    ['cloudflare-saas.mjs', 'un hostname présent est doublé', (s) => s.replace("} else if (!ch) {\n        ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);", "} else if (!ch) {\n        ch = await client.creer(adresse.hote);")],
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
      const g = fichier === 'gandi.mjs' ? await import(pathToFileURL(f).href) : await import(mod('gandi.mjs'));
      const c = fichier === 'cloudflare-saas.mjs' ? await import(pathToFileURL(f).href) : await import(mod('cloudflare-saas.mjs'));
      const { fautes } = await essayer(g, c);
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}
