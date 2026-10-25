#!/usr/bin/env node
// Fabrique les sites du lot du jour : dix par métier, pour les mieux notés.
//
// Spécification : `app/specs/08-PROSPECTION.md`. C'est la pièce entre la
// qualification (`qualifier.mjs`, qui dit QUI appeler) et la publication
// (`publier.mjs`, qui met les sites en ligne sur des liens privés).
//
// Trois choses à savoir avant de lire le code.
//
// 1. **Mode prospection.** Les photos sont celles de la banque d'images du
//    métier, pas celles de l'artisan : le dossier porte un fichier
//    `SOURCE-ILLUSTRATION`, le générateur pose alors la mention visible dans la
//    page et refuse `--publication`. Un site de prospection ne part jamais en
//    ligne au nom de l'artisan sans ses vraies photos (règle du dépôt,
//    `rules/common/ne-pas-fabriquer.md`).
//
// 2. **Un métier sans images est sauté**, avec son message : le contrôle est
//    celui de `verifier-images.mjs`, pas une liste recopiée ici. Les images ne
//    sont pas dans Git (décision de Fabrice : pas de Git LFS) et celles de
//    couverture et de peinture attendent l'action F18 de Fabrice. Ce qui
//    bloque ne doit pas être bloquant : les autres métiers se fabriquent.
//
// 3. **Deux registres, qui ne se mélangent pas.**
//    - `prospection/registre.json` : les artisans (qui a reçu un site, quand,
//      sous quel slug, où en est l'appel). Versionné, sans aucun numéro de
//      téléphone (`registre.mjs`, `valider()`).
//    - `prospection/registre-sites.json` : le registre d'unicité du
//      générateur pour les sites de prospection, l'équivalent de
//      `generateur/registre.json` pour les sites de démonstration. C'est lui
//      qui fait que deux ravaleurs voisins ne reçoivent pas deux sites
//      jumeaux. Il ne se mélange pas à celui de la démonstration, sinon les
//      trois sites de démonstration compteraient comme des voisins et le
//      contraire serait vrai aussi.
//
// Les sites fabriqués vont dans `sites/prospection/<jour>/<siren>/` (dossier
// `sites/` ignoré par Git : un site pèse plusieurs mégaoctets d'images). La
// convention de ce chemin est lue par la publication : jour et SIREN se
// relisent dans le registre.
//
//   node scripts/prospection/fabriquer-lot.mjs --lot <fichier.json>
//   node scripts/prospection/fabriquer-lot.mjs --extraire          (réseau)
//
//   --lot <fichier>       la liste à fabriquer : un tableau d'entreprises, ou
//                         { lot: [...] } (la sortie de `qualifier.lot()`)
//   --extraire            extrait et qualifie en direct (appelle l'API), puis
//                         prend les `--combien` meilleurs de chaque métier
//   --combien <n>         sites par métier (défaut 10)
//   --metiers a,b         ne fabriquer que ces métiers
//   --jour <AAAA-MM-JJ>   défaut : aujourd'hui, heure de Paris
//   --sortie <dossier>    défaut sites/prospection/<jour>
//   --images <dossier>    racine des images (défaut images/)
//   --registre <fichier>  registre d'unicité des sites (défaut prospection/registre-sites.json)
//   --appels <fichier>    registre des artisans (défaut prospection/registre.json)
//   --mobile <n>          sites passés au vérificateur mobile (défaut 1 ; 0 pour aucun)
//   --sans-mobile         raccourci pour --mobile 0
//   --sec                 ne fabrique rien : dit ce qui serait fait
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import { verifier as verifierImages } from '../verifier-images.mjs';
import * as registreAppels from './registre.mjs';

export const SLUG_LONGUEUR = 16;

// Un slug qui ne se devine pas : le site est privé, son adresse est son seul
// secret (08-PROSPECTION.md, cadre légal). 16 caractères tirés au hasard par
// le générateur du système, pas par Math.random.
export function slug(longueur = SLUG_LONGUEUR) {
  return randomBytes(longueur).toString('base64url').replace(/[-_]/g, '').slice(0, longueur).toLowerCase();
}

export const jourDeParis = (d = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', dateStyle: 'short' }).format(d);

// Le fichier de données que le générateur attend : la forme de l'API des
// entreprises (`generateur/sirene.mjs`). Rien n'est inventé : un champ que
// l'extraction n'a pas reste absent, et la page affiche la ligne vide telle
// quelle. L'extraction, elle, garde ce que l'API donne.
export function donneesSirene(e) {
  return {
    siren: e.siren,
    nom_complet: e.nom,
    nom_raison_sociale: e.nom,
    date_creation: e.dateCreation ?? null,
    activite_principale: e.codeApe ?? null,
    nature_juridique: e.natureJuridique ?? null,
    tranche_effectif_salarie: e.effectif ?? null,
    complements: { est_rge: Boolean(e.rge) },
    siege: {
      siret: e.siret ?? null,
      adresse: e.adresse ?? null,
      libelle_commune: e.commune ?? null,
      code_postal: e.codePostal ?? null,
    },
  };
}

// Les images d'un métier sont-elles là ? La réponse vient du vérificateur, pas
// d'un test d'existence de dossier : une image trop petite ou une paire
// désalignée rendrait le site bancal, et il vaut mieux sauter le métier.
export async function imagesPretes(metier, { racine = join(RACINE, 'images') } = {}) {
  const sources = join(racine, metier, 'sources');
  try {
    const { fautes } = await verifierImages(metier, { racine, dire: () => {} });
    // Le marqueur d'illustration décide de la mention « ces photos sont des
    // exemples » dans la page (décision de Fabrice, 2 octobre). Sans lui, le
    // site de prospection montrerait des images de banque sans le dire : le
    // métier est sauté plutôt que fabriqué en silence.
    if (!fautes.length && !existsSync(join(sources, 'SOURCE-ILLUSTRATION')))
      fautes.push(`${sources} n a pas son fichier SOURCE-ILLUSTRATION : la page ne porterait pas la mention « images d illustration ». Le créer, vide, avant de fabriquer`);
    return { pretes: fautes.length === 0, fautes };
  } catch (e) {
    return { pretes: false, fautes: [`${metier} : ${e.message}`] };
  }
}

function lancer(cmd, args, dire) {
  const r = spawnSync(process.execPath, args, { cwd: RACINE, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const sortie = (r.stdout || '') + (r.stderr || '');
  if (r.status !== 0) dire(`    ${cmd} a échoué (sortie ${r.status}) : ${sortie.trim().split('\n').slice(-3).join(' | ')}`);
  return { ok: r.status === 0, sortie };
}

export async function fabriquerLot({
  lot, jour = jourDeParis(), sortie = null, images = join(RACINE, 'images'),
  registre = join(RACINE, 'prospection', 'registre-sites.json'),
  appels = registreAppels.CHEMIN, mobile = 1, sec = false, dire = console.log,
} = {}) {
  const dossier = sortie || join(RACINE, 'sites', 'prospection', jour);
  const parMetier = {};
  for (const e of lot) (parMetier[e.metier] ||= []).push(e);

  const bilan = { jour, dossier, fabriques: [], sautes: [], echecs: [], metiers: {} };
  dire(`Lot du ${jour} : ${lot.length} site(s) à fabriquer, ${Object.keys(parMetier).length} métier(s), dans ${dossier}`);

  for (const [metier, liste] of Object.entries(parMetier)) {
    const etat = await imagesPretes(metier, { racine: images });
    bilan.metiers[metier] = { demandes: liste.length, fabriques: 0, pretes: etat.pretes };
    if (!etat.pretes) {
      bilan.sautes.push(...liste.map((e) => ({ ...e, motif: `images de « ${metier} » absentes ou incomplètes` })));
      dire(`\n  ${metier} : SAUTÉ, ${liste.length} site(s) non fabriqué(s).`);
      dire(`    ${etat.fautes.length} faute(s) sur les images, la première : ${etat.fautes[0]}`);
      dire(`    à faire : générer les images (action F18, textes prêts dans banque/prompts/${metier}.md),`);
      dire(`    puis mesurer : node scripts/verifier-images.mjs ${metier}`);
      continue;
    }
    dire(`\n  ${metier} : images prêtes, ${liste.length} site(s)`);
    const dossierImages = join(images, metier, 'sources');

    for (const e of liste) {
      const cible = join(dossier, e.siren);
      dire(`    ${e.siren}  ${String(e.nom).slice(0, 34).padEnd(36)} note ${String(e.note ?? '?').padStart(3)}`);
      if (sec) { bilan.fabriques.push({ ...e, dossier: cible, slug: null }); bilan.metiers[metier].fabriques++; continue; }

      mkdirSync(cible, { recursive: true });
      const fichierDonnees = join(cible, 'sirene.json');
      writeFileSync(fichierDonnees, JSON.stringify(donneesSirene(e), null, 2) + '\n', 'utf8');

      const fait = lancer('le générateur', [join(RACINE, 'generateur', 'composer.mjs'),
        '--siren', e.siren, '--metier', metier, '--images', dossierImages,
        '--sortie', cible, '--donnees', fichierDonnees, '--registre', registre], dire);
      if (!fait.ok) { bilan.echecs.push({ ...e, motif: 'fabrication' }); rmSync(cible, { recursive: true, force: true }); continue; }

      const plancher = lancer('verifier-site', [join(RACINE, 'scripts', 'verifier-site.mjs'), cible], dire);
      if (!plancher.ok) { bilan.echecs.push({ ...e, motif: 'plancher de la page' }); continue; }

      bilan.fabriques.push({ ...e, dossier: cible, slug: slug() });
      bilan.metiers[metier].fabriques++;
    }
  }

  // Le vérificateur mobile ouvre un vrai navigateur sur trois téléphones :
  // quelques minutes par site. Le lot en passe `mobile`, les premiers de la
  // liste, et le bilan dit combien. Jamais « vérifié » pour un site qui ne
  // l'a pas été.
  bilan.mobile = [];
  for (const f of bilan.fabriques.slice(0, sec ? 0 : Math.max(0, mobile))) {
    dire(`\n  vérificateur mobile sur ${f.siren}`);
    const r = lancer('verifier-mobile', [join(RACINE, 'scripts', 'verifier-mobile.mjs'), f.dossier], dire);
    bilan.mobile.push({ siren: f.siren, ok: r.ok });
    if (!r.ok) bilan.echecs.push({ ...f, motif: 'rendu sur téléphone' });
  }

  // L'unicité se mesure sur le lot entier, pas site par site : c'est la
  // distance entre voisins qui compte (U1 à U4).
  if (!sec && bilan.fabriques.length > 1) {
    dire('\n  unicité du lot');
    const r = lancer('verifier-unicite', [join(RACINE, 'scripts', 'verifier-unicite.mjs'), dossier], dire);
    bilan.unicite = r.ok;
    if (!r.ok) bilan.echecs.push({ motif: 'unicité du lot' });
    else dire(`    ${r.sortie.trim().split('\n').slice(-1)[0]}`);
  }

  // Les artisans entrent au registre une fois leur site fabriqué et vérifié,
  // avec leur slug. Le registre refuse l'écriture s'il trouve un numéro de
  // téléphone, où que ce soit dans le fichier.
  if (!sec && bilan.fabriques.length) {
    const reg = registreAppels.lire(appels);
    for (const f of bilan.fabriques) registreAppels.inscrire(reg, f, { jour, slug: f.slug });
    const fautes = registreAppels.valider(reg);
    if (fautes.length) {
      bilan.echecs.push({ motif: `registre refusé : ${fautes[0]}` });
      dire(`\n  REGISTRE REFUSÉ, rien n’est écrit : ${fautes.join(' ; ')}`);
    } else {
      registreAppels.ecrire(reg, appels);
      dire(`\n  ${bilan.fabriques.length} artisan(s) inscrits dans ${appels}`);
    }
    // Le lot, tel qu'il est sur le disque : ce que la publication lira. Il vit
    // dans le dossier du jour, hors de Git, parce qu'il cite des chemins de
    // cette machine ; la vérité versionnée, c'est le registre.
    writeFileSync(join(dossier, 'lot.json'), JSON.stringify({ jour, sites: bilan.fabriques.map((f) => ({
      siren: f.siren, nom: f.nom, metier: f.metier, commune: f.commune, note: f.note ?? null,
      pourquoi: f.pourquoi ?? [], slug: f.slug, dossier: f.dossier.replace(RACINE, '').replace(/^[\\/]/, ''),
    })) }, null, 2) + '\n', 'utf8');
  }

  dire(`\n${bilan.fabriques.length} site(s) fabriqué(s), ${bilan.sautes.length} sauté(s), ${bilan.echecs.length} en échec.`);
  for (const [m, v] of Object.entries(bilan.metiers)) dire(`  ${m} : ${v.fabriques} / ${v.demandes}${v.pretes ? '' : '  (images absentes)'}`);
  if (bilan.mobile.length) dire(`  vérificateur mobile passé sur ${bilan.mobile.length} site(s) : ${bilan.mobile.map((x) => `${x.siren} ${x.ok ? 'ok' : 'FAUTE'}`).join(', ')}`);
  else if (!sec) dire('  vérificateur mobile : aucun site (demandé : 0)');
  for (const x of bilan.echecs) dire(`  ÉCHEC ${x.siren || ''} ${x.motif}`);
  return bilan;
}

// ------------------------------------------------------------------- en ligne
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const val = (nom, defaut = null) => { const i = args.indexOf('--' + nom); return i > -1 ? args[i + 1] : defaut; };
  const jour = val('jour', jourDeParis());
  const combien = Number(val('combien', 10));
  const filtre = val('metiers')?.split(',').map((x) => x.trim()).filter(Boolean) || null;

  let lot = [];
  const fichier = val('lot');
  if (fichier) {
    const j = JSON.parse(readFileSync(resolve(fichier), 'utf8'));
    lot = Array.isArray(j) ? j : (j.lot || j.sites || []);
  } else if (args.includes('--extraire')) {
    const { extraire, metiers } = await import('./extraire.mjs');
    const { qualifier, lot: prendreLot } = await import('./qualifier.mjs');
    const fiche = metiers();
    const reg = registreAppels.lire(val('appels', registreAppels.CHEMIN));
    const parMetier = {};
    for (const m of fiche.metiers) {
      if (filtre && !filtre.includes(m.nom)) continue;
      console.log(`extraction : ${m.nom}`);
      const { entreprises } = await extraire({ metier: m.nom, fiche, dire: (d) => console.log('  ' + d) });
      parMetier[m.nom] = qualifier(entreprises, { registre: reg }).retenus;
      console.log(`  ${parMetier[m.nom].length} retenues`);
    }
    lot = prendreLot(parMetier, combien);
  } else {
    console.error('usage : node scripts/prospection/fabriquer-lot.mjs --lot <fichier.json> | --extraire');
    process.exit(2);
  }

  if (filtre) lot = lot.filter((e) => filtre.includes(e.metier));
  if (!lot.length) { console.error('lot vide : rien à fabriquer.'); process.exit(2); }

  const bilan = await fabriquerLot({
    lot, jour,
    sortie: val('sortie') ? resolve(val('sortie')) : null,
    images: val('images') ? resolve(val('images')) : join(RACINE, 'images'),
    registre: val('registre') ? resolve(val('registre')) : join(RACINE, 'prospection', 'registre-sites.json'),
    appels: val('appels') ? resolve(val('appels')) : registreAppels.CHEMIN,
    mobile: args.includes('--sans-mobile') ? 0 : Number(val('mobile', 1)),
    sec: args.includes('--sec'),
  });
  process.exitCode = bilan.echecs.length ? 1 : 0;
}
