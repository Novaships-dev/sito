#!/usr/bin/env node
// Trouver les artisans à appeler, dans les bases publiques.
//
// Source : `recherche-entreprises.api.gouv.fr` (API publique de la DINUM,
// sans clé, sans compte). Spécification : `app/specs/08-PROSPECTION.md`.
// Décision de Fabrice du 24 octobre : « Je veux des artisans réels. »
//
// CE QUE L'API FAIT VRAIMENT, mesuré le 24 octobre 2026 (journal du jour) :
//
//   - un **nom de paramètre inconnu est ignoré en silence**. `departement=13`
//     rend 4 019 résultats, `departement_siege=13` en rend 10 000, comme si
//     aucun filtre n'avait été posé. Une faute de frappe ne se voit donc pas
//     dans la réponse : `verifierFiltres()` la débusque en comparant le nombre
//     de résultats avec et sans le filtre, et l'extraction refuse de partir
//     tant que ce contrôle n'est pas passé ;
//   - une **valeur** invalide de `activite_principale`, elle, rend un 400 qui
//     liste les valeurs valables. Le code veut la forme pointée (`43.34Z`) ;
//   - `total_results` est **plafonné à 10 000**, et `page × per_page` aussi
//     (400 au-delà). `per_page` ne dépasse pas 25 ;
//   - `departement=13` ne filtre **pas le siège** : il garde toute entreprise
//     qui a au moins un établissement dans le 13, siège à Quimper compris.
//     Pour appeler un artisan du coin, le filtre se refait ici sur
//     `siege.departement` ;
//   - `tranche_effectif_salarie=NN` (non renseigné) pèse 3 418 des 3 979
//     petites entreprises du 13 en 43.34Z : l'exclure jetterait presque tous
//     les artisans visés. Il est gardé, et vaut peu de points (qualifier.mjs) ;
//   - le RGE est déjà dans la réponse (`complements.est_rge`) : pas besoin
//     d'interroger la base ADEME à part.
//
// Un même code APE mélange des métiers (43.34Z est « peinture **et
// vitrerie** » : la réponse est pleine de miroitiers). Le métier se tranche
// donc aussi sur la raison sociale, avec les mots de `prospection/metiers.json`.
//
// Aucun numéro de téléphone n'est lu ni gardé : l'API n'en donne pas, et
// Fabrice appelle depuis la fiche publique (cadre légal, 08-PROSPECTION.md).
//
//   node scripts/prospection/extraire.mjs <metier> [--pages=4] [--departement=13]
//   node scripts/prospection/extraire.mjs --enregistrer-essai <fichier.json>
//     enregistre une population d'entreprises réelles pour les essais, qui
//     tournent ensuite sans réseau.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import { nomAffiche, communeOfficielle, chargerCommunes } from './noms.mjs';

export const API = 'https://recherche-entreprises.api.gouv.fr/search';
export const PER_PAGE_MAX = 25;     // plafond de l'API
export const PLAFOND = 10000;       // total_results, et page × per_page
// Jusqu'à 9 salariés. `NN` = effectif non renseigné : la grande majorité des
// artisans visés, qu'il serait absurde d'écarter.
export const EFFECTIFS = ['NN', '00', '01', '02', '03'];
export const ANCIENNETE_MIN = 2;    // années : une entreprise de moins de 2 ans n'est pas installée

const CODE_APE = /^\d{2}\.\d{2}[A-Z]$/;
const DEPARTEMENT = /^(\d{2}[AB]?|\d{3})$/;

export function metiers(chemin = join(RACINE, 'prospection', 'metiers.json')) {
  return JSON.parse(readFileSync(chemin, 'utf8'));
}

export function metier(nom, fiche = metiers()) {
  const m = fiche.metiers.find((x) => x.nom === nom);
  if (!m) throw new Error(`métier inconnu : ${nom} (connus : ${fiche.metiers.map((x) => x.nom).join(', ')})`);
  return m;
}

// ------------------------------------------------------------------- l'adresse
// Construite ici et nulle part ailleurs, et refusée avant tout appel réseau si
// elle dépasse ce que l'API accepte : un 400 au bout de 40 pages coûte cher.
export function adresse({ codeApe, departement, effectifs = EFFECTIFS, page = 1, perPage = PER_PAGE_MAX, rge = null }) {
  if (!CODE_APE.test(codeApe || '')) throw new Error(`code APE attendu sous la forme 43.34Z, reçu : ${codeApe}`);
  if (!DEPARTEMENT.test(departement || '')) throw new Error(`département attendu sous la forme 13, reçu : ${departement}`);
  if (perPage < 1 || perPage > PER_PAGE_MAX) throw new Error(`per_page doit tenir entre 1 et ${PER_PAGE_MAX}, reçu : ${perPage}`);
  if (page < 1) throw new Error(`page doit valoir 1 au moins, reçu : ${page}`);
  if (page * perPage > PLAFOND) throw new Error(`page × per_page dépasse le plafond de ${PLAFOND} résultats de l API (${page} × ${perPage})`);
  const p = new URLSearchParams();
  p.set('activite_principale', codeApe);
  p.set('departement', departement);
  p.set('etat_administratif', 'A');
  if (effectifs?.length) p.set('tranche_effectif_salarie', effectifs.join(','));
  if (rge !== null) p.set('est_rge', String(rge));
  p.set('page', String(page));
  p.set('per_page', String(perPage));
  return `${API}?${p}`;
}

async function appeler(url, f) {
  const r = await f(url);
  if (!r.ok) {
    const texte = (await r.text().catch(() => '')).slice(0, 300);
    throw new Error(`recherche-entreprises : HTTP ${r.status} sur ${url.replace(API, 'search')} — ${texte}`);
  }
  return r.json();
}

// ------------------------------------------------- le filtre a-t-il vraiment filtré ?
// Comparer « avec » et « sans » ne suffit pas : deux totaux égaux peuvent dire
// « le paramètre est ignoré » comme « il n'y avait rien à écarter ». La
// première version de ce contrôle s'est arrêtée sur 43.99D, où toutes les
// entreprises du 13 étaient déjà dans la bonne tranche d'effectif.
//
// Le signal décisif est une **valeur impossible** : si le serveur honore le
// paramètre, le total s'effondre ; s'il l'ignore, il ne bouge pas. Mesuré le
// 24 octobre sur 43.99D : 10 000 sans filtre, 571 avec `departement=13`, 6
// avec `departement=976` (Mayotte), 0 avec `tranche_effectif_salarie=52`
// (5 000 salariés et plus).
export const ABSURDES = {
  departement: '976',               // Mayotte : valeur valide, et vide pour un artisan du 13
  tranche_effectif_salarie: '52',   // 5 000 à 9 999 salariés : aucun artisan n en a
};

const sansParametre = (url, cle) => { const u = new URL(url); u.searchParams.delete(cle); return u.toString(); };
const avecParametre = (url, cle, valeur) => { const u = new URL(url); u.searchParams.set(cle, valeur); return u.toString(); };

export async function verifierFiltres({ codeApe, departement, effectifs = EFFECTIFS, fetch: f = fetch }) {
  const url = adresse({ codeApe, departement, effectifs, perPage: 1 });
  const poses = new URL(url).searchParams;
  const fautes = [];
  // D'abord sans réseau : le paramètre est-il seulement écrit ? Une faute de
  // frappe (`departement_siege`) se voit ici, avant le premier appel.
  for (const cle of Object.keys(ABSURDES)) {
    if (!poses.has(cle)) fautes.push(`l adresse ne pose pas le paramètre « ${cle} » (posés : ${[...poses.keys()].join(', ')})`);
  }
  if (fautes.length) return { avec: null, mesures: {}, fautes };

  const total = async (u) => (await appeler(u, f)).total_results;
  const avec = await total(url);
  const mesures = {};
  for (const [cle, absurde] of Object.entries(ABSURDES)) {
    const sans = await total(sansParametre(url, cle));
    const impossible = await total(avecParametre(url, cle, absurde));
    mesures[cle] = { sans, impossible };
    if (impossible >= sans) {
      fautes.push(`le filtre « ${cle} » n a aucun effet : ${sans} résultats sans lui, ${impossible} avec la valeur impossible « ${absurde} »`);
    }
  }
  return { avec, mesures, fautes };
}

// ------------------------------------------------------------------ le métier
// Sans accents, sans ponctuation : « FAÇADES DU SUD » et « FACADES-DU-SUD »
// sont le même nom.
export function normaliser(texte) {
  return (texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Mot entier, **avec son pluriel**, jamais un morceau de mot. Les deux moitiés
// de cette règle ont été mesurées sur les 693 entreprises réelles de la
// population d'essai :
//
//   - par morceaux, « ite » (pour l'isolation thermique par l'extérieur)
//     attrape ATS ETANCHEITE et 47 autres noms qui n'ont rien à voir ;
//   - par mot strictement entier, « charpente » rate SARL MIDI CHARPENTES, et
//     « couverture » rate LES COUVERTURES LOPEZ — qui serait alors appelée
//     comme peintre.
//
// D'où le `s?` final. Les expressions de plusieurs mots marchent telles
// quelles, `normaliser` ayant ramené tous les séparateurs à une espace.
const motif = (m) => new RegExp(`(?:^| )${normaliser(m)}s?(?: |$)`);
const contient = (nom, mots) => mots.find((m) => motif(m).test(nom));

// Rend le mot qui a tranché, ou null. Un nom qui porte le mot d'un AUTRE
// métier n'est pas de celui-ci : un « MIROITERIE MASSILIA » en 43.34Z n'est ni
// peintre ni ravaleur.
//
// `motsAutreMetier` : un métier voisin, qui ne compte que si le nom ne dit
// pas aussi celui-ci. « BMAV MACONNERIE » n'est pas façadier ; « FACADES ET
// MACONNERIE » l'est (décision du 29 oct. 2026 : « Ravalement de façade c'est
// des façadiers »).
export function nomDitLeMetier(nom, m) {
  const n = normaliser(nom);
  const exclu = contient(n, m.motsExclus || []);
  if (exclu) return { metier: false, mot: exclu };
  const dit = contient(n, m.mots || []);
  if (dit) return { metier: true, mot: dit };
  const autre = contient(n, m.motsAutreMetier || []);
  if (autre) return { metier: false, mot: autre };
  return { metier: null, mot: null };
}

// ------------------------------------------------------------------- retenir
const anneesDepuis = (date, aujourdhui) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return (aujourdhui.getTime() - d.getTime()) / (365.2425 * 24 * 3600 * 1000);
};

// Rend { garde: true, entreprise } ou { garde: false, motif, detail }.
//
// `motif` est la **catégorie**, toujours la même phrase, et `detail` ce qui
// change d'une entreprise à l'autre. Les deux étaient mélangés au départ : le
// bilan sortait alors une ligne par date de création, illisible.
//
// Tous les filtres que l'API prétend appliquer sont refaits ici, parce qu'elle
// en ignore en silence (voir l'en-tête).
//
// Un nom muet (« NICOLAS FERMAUD ») est gardé, mais si le métier exige une
// preuve (`preuveDuMetier`, le ravalement : aucun code APE ne le dit), il
// porte `preuveExigee` : seule la recherche web peut alors le faire entrer
// dans le lot (`qualifier.mjs`).
export function retenir(e, { m, departement, aujourdhui, ancienneteMin = ANCIENNETE_MIN, effectifs = EFFECTIFS, communes = null }) {
  const siege = e.siege || {};
  const non = (motif, detail) => ({ garde: false, motif, detail });
  if (e.etat_administratif !== 'A') return non('entreprise fermée', e.etat_administratif);
  if (siege.etat_administratif && siege.etat_administratif !== 'A') return non('siège fermé', siege.siret);
  if (siege.departement !== departement) return non(`siège hors du ${departement}`, siege.departement || 'département inconnu');
  if (!effectifs.includes(e.tranche_effectif_salarie)) return non('effectif hors cible', String(e.tranche_effectif_salarie));
  const annees = anneesDepuis(e.date_creation, aujourdhui);
  if (annees === null) return non('date de création illisible', String(e.date_creation));
  if (annees < ancienneteMin) return non(`créée il y a moins de ${ancienneteMin} ans`, e.date_creation);
  if (!m.codesApe.includes(e.activite_principale)) return non('code APE hors du métier', e.activite_principale);
  // Le métier se lit sur tout ce qui nomme l'entreprise (raison sociale et
  // nom commercial) ; le site, lui, écrit le nom choisi par `nomAffiche`.
  const nom = e.nom_complet || e.nom_raison_sociale || '';
  const dit = nomDitLeMetier(nom, m);
  if (dit.metier === false) return non('la raison sociale dit un autre métier', `${nom} : « ${dit.mot} »`);

  return {
    garde: true,
    entreprise: {
      siren: e.siren,
      nom: nomAffiche(e),
      metier: m.nom,
      commune: communeOfficielle(siege, communes) || siege.libelle_commune || null,
      codePostal: siege.code_postal || null,
      codeApe: e.activite_principale,
      dateCreation: e.date_creation,
      annees: Math.floor(annees),
      effectif: e.tranche_effectif_salarie,
      rge: Boolean(e.complements?.est_rge),
      nomDitLeMetier: dit.metier === true,
      preuveExigee: dit.metier !== true && Boolean(m.preuveDuMetier),
    },
  };
}

// ------------------------------------------------------------------ extraire
// Parcourt les codes APE du métier, page par page, et rend les entreprises
// retenues sans doublon de SIREN, avec le compte de ce qui a été écarté et
// pourquoi : rien n'est « réussi » qui ne soit compté ici.
export async function extraire({
  metier: nom, fiche = metiers(), departement, pages = 4, perPage = PER_PAGE_MAX,
  ancienneteMin = ANCIENNETE_MIN, effectifs = EFFECTIFS, aujourdhui = new Date(),
  verifier = true, fetch: f = fetch, dire = () => {},
} = {}) {
  const m = metier(nom, fiche);
  const dep = departement || fiche.departement;
  const communes = chargerCommunes(dep);
  if (!communes) dire(`ATTENTION : prospection/communes-${dep}.json absent, les communes gardent l écriture de l API (node scripts/prospection/noms.mjs --telecharger ${dep})`);
  const bilan = { metier: nom, departement: dep, lus: 0, retenus: 0, doublons: 0, ecartes: {}, plafonds: [], pages: 0 };
  const vus = new Set();
  const entreprises = [];

  for (const codeApe of m.codesApe) {
    if (verifier) {
      const v = await verifierFiltres({ codeApe, departement: dep, effectifs, fetch: f });
      if (v.fautes.length) throw new Error(`les filtres de l API ne sont pas appliqués pour ${codeApe} : ${v.fautes.join(' ; ')}`);
      if (v.avec >= PLAFOND) bilan.plafonds.push(`${codeApe} : ${v.avec} résultats, le plafond de l API — la liste est tronquée`);
      dire(`${codeApe} : ${v.avec} entreprises dans le ${dep} (filtres vérifiés : ${Object.entries(v.mesures).map(([k, m]) => `${k} ${m.sans}→${m.impossible}`).join(', ')})`);
    }
    for (let page = 1; page <= pages; page++) {
      if (page * perPage > PLAFOND) break;
      const j = await appeler(adresse({ codeApe, departement: dep, effectifs, page, perPage }), f);
      bilan.pages++;
      const lot = j.results || [];
      bilan.lus += lot.length;
      for (const e of lot) {
        if (vus.has(e.siren)) { bilan.doublons++; continue; }
        vus.add(e.siren);
        const r = retenir(e, { m, departement: dep, aujourdhui, ancienneteMin, effectifs, communes });
        if (!r.garde) {
          const vu = bilan.ecartes[r.motif] || (bilan.ecartes[r.motif] = { combien: 0, exemples: [] });
          vu.combien++;
          if (vu.exemples.length < 3 && r.detail) vu.exemples.push(r.detail);
          continue;
        }
        entreprises.push(r.entreprise);
      }
      if (lot.length < perPage || page >= (j.total_pages || 1)) break;
    }
  }
  bilan.retenus = entreprises.length;
  return { entreprises, bilan };
}

// --------------------------------------------- enregistrer une population d'essai
// Les essais tournent sans réseau (la CI n'a rien à demander à data.gouv.fr).
// Ils rejouent donc une population d'entreprises RÉELLES, prélevée une fois
// par cette commande, avec la date du prélèvement. Elle prend exprès de quoi
// faire travailler les filtres : des entreprises hors du 13, trop grandes et
// trop jeunes, que l'extraction devra écarter.
// Chaque entreprise est réduite à ce que l'extraction et la note lisent, plus
// les départements de ses établissements, dont le faux serveur a besoin pour
// refaire le `departement=13` de l'API (qui regarde tous les établissements).
// Une réponse entière pèse une dizaine de kilo-octets à cause de
// `matching_etablissements` et des dirigeants : la population tiendrait en
// mégaoctets dans Git pour rien.
export function reduire(e) {
  const s = e.siege || {};
  return {
    siren: e.siren,
    nom_complet: e.nom_complet,
    nom_raison_sociale: e.nom_raison_sociale,
    activite_principale: e.activite_principale,
    date_creation: e.date_creation,
    etat_administratif: e.etat_administratif,
    tranche_effectif_salarie: e.tranche_effectif_salarie,
    complements: { est_rge: Boolean(e.complements?.est_rge) },
    siege: {
      siret: s.siret, departement: s.departement, libelle_commune: s.libelle_commune,
      code_postal: s.code_postal, etat_administratif: s.etat_administratif,
      commune: s.commune, nom_commercial: s.nom_commercial, liste_enseignes: s.liste_enseignes,
    },
    departements_etablissements: [...new Set([s.departement, ...(e.matching_etablissements || []).map((x) => x.code_postal?.slice(0, 2))].filter(Boolean))],
  };
}

async function enregistrerEssai(cible, { fetch: f = fetch } = {}) {
  const fiche = metiers();
  const dep = fiche.departement;
  const codes = [...new Set(fiche.metiers.flatMap((m) => m.codesApe))];
  const population = new Map();
  const prendre = async (url) => {
    const j = await appeler(url, f);
    for (const e of j.results || []) population.set(e.siren, reduire(e));
    return j.total_results;
  };
  for (const codeApe of codes) {
    // la cible : petites, dans le 13
    await prendre(adresse({ codeApe, departement: dep, page: 1, perPage: PER_PAGE_MAX }));
    await prendre(adresse({ codeApe, departement: dep, page: 2, perPage: PER_PAGE_MAX }));
    // les RGE, rares : sans eux la note ne serait jamais essayée sur un vrai RGE
    await prendre(adresse({ codeApe, departement: dep, rge: true, page: 1, perPage: PER_PAGE_MAX }));
    // sans filtre d'effectif ni de département : de quoi faire rougir les filtres
    await prendre(`${API}?activite_principale=${codeApe}&etat_administratif=A&page=1&per_page=${PER_PAGE_MAX}`);
    console.log(`${codeApe} : ${population.size} entreprises dans la population`);
  }
  const corpus = {
    quoi: 'Population d entreprises reelles prelevee une fois dans recherche-entreprises.api.gouv.fr, pour que les essais tournent sans reseau.',
    comment: 'node scripts/prospection/extraire.mjs --enregistrer-essai prospection/essais/recherche-entreprises.json',
    prelevee_le: new Date().toISOString().slice(0, 10),
    source: API,
    entreprises: [...population.values()].sort((a, b) => a.siren.localeCompare(b.siren)),
  };
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, JSON.stringify(corpus, null, 1) + '\n');
  console.log(`\n${corpus.entreprises.length} entreprises écrites dans ${cible}`);
}

// ------------------------------------------------------------------- en ligne
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--enregistrer-essai');
  if (i >= 0) {
    await enregistrerEssai(args[i + 1] || join(RACINE, 'prospection', 'essais', 'recherche-entreprises.json'));
  } else {
    const nom = args.find((a) => !a.startsWith('--'));
    if (!nom) { console.error('usage : node scripts/prospection/extraire.mjs <metier> [--pages=4]'); process.exit(2); }
    const pages = Number(args.find((a) => a.startsWith('--pages='))?.slice(8)) || 4;
    const departement = args.find((a) => a.startsWith('--departement='))?.slice(14);
    const { entreprises, bilan } = await extraire({ metier: nom, pages, departement, dire: (d) => console.log('  ' + d) });
    console.log(`\n${bilan.lus} entreprises lues, ${bilan.retenus} retenues, ${bilan.doublons} doublons.`);
    for (const [motif, v] of Object.entries(bilan.ecartes).sort((a, b) => b[1].combien - a[1].combien)) {
      console.log(`  écartées, ${motif} : ${v.combien}${v.exemples.length ? `  (${v.exemples.join(', ')}…)` : ''}`);
    }
    for (const p of bilan.plafonds) console.log(`  ATTENTION ${p}`);
    for (const e of entreprises.slice(0, 10)) console.log(`  ${e.siren}  ${e.nom.padEnd(40).slice(0, 40)} ${(e.commune || '').padEnd(22)} ${e.annees} ans  eff ${e.effectif}${e.rge ? '  RGE' : ''}`);
  }
}
