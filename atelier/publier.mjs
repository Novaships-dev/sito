// Publier un site par versions, sans jamais casser celui qui est en ligne.
//
// app/PLAN-APP.md, section 3.3 :
//   1. le site fabriqué passe les vérificateurs ; s'il reste un bloquant, on
//      s'arrête et la version en ligne ne bouge pas ;
//   2. ses fichiers s'écrivent dans sites/<site>/<n>/, à côté de la version
//      en ligne ; un fichier identique à la version précédente est recopié
//      dans le stockage, pas renvoyé ;
//   3. le pointeur de chaque adresse passe à <n> : un visiteur voit une
//      version entière, jamais un mélange ;
//   4. on garde les deux dernières versions pour revenir en arrière.
//
// Le stockage et la table des adresses sont passés en paramètre : un dossier
// et un fichier JSON pour les essais, R2 et Workers KV en production
// (adaptateurs Cloudflare à écrire quand le compte existera).

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { join, relative, dirname, sep } from 'node:path';

const MANIFESTE = '.manifeste.json'; // un fichier caché : le Worker refuse de le servir
export const VERSIONS_GARDEES = 2;

// Ce qui ne part jamais en ligne : les données internes du générateur.
const EXCLUS = [/^donnees\.json$/, /(^|\/)\./, /\.log$/];

async function fichiersDe(dossier) {
  const out = [];
  async function parcourir(d) {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) await parcourir(p);
      else if (e.isFile()) {
        const rel = relative(dossier, p).split(sep).join('/');
        if (!EXCLUS.some(re => re.test(rel))) out.push(rel);
      }
    }
  }
  await parcourir(dossier);
  return out.sort();
}

const empreinte = (b) => createHash('sha256').update(b).digest('hex');

// ---------------------------------------------------------------- publier
export async function publierVersion({ site, dossier, stockage, adresses, hotes, verifier }) {
  if (!/^[a-z0-9-]{1,64}$/.test(site)) throw new Error('identifiant de site invalide : ' + site);
  if (!hotes || !hotes.length) throw new Error('aucune adresse à faire pointer');

  // 1. Vérifier avant d'écrire quoi que ce soit.
  const verdict = await verifier(dossier);
  if (!verdict || !verdict.ok) {
    return { publie: false, motif: 'vérification refusée', bloquants: verdict?.bloquants || [] };
  }

  const fichiers = await fichiersDe(dossier);
  if (!fichiers.includes('index.html')) return { publie: false, motif: 'pas de page d accueil (index.html)', bloquants: [] };

  // 2. Version précédente et son manifeste.
  const versions = await versionsDe(stockage, site);
  const precedente = versions.length ? versions[versions.length - 1] : 0;
  const n = precedente + 1;
  const ancien = precedente ? JSON.parse((await stockage.lire(`sites/${site}/${precedente}/${MANIFESTE}`)).toString()) : {};

  const manifeste = {};
  let envoyes = 0, recopies = 0, octets = 0;
  for (const rel of fichiers) {
    const contenu = await readFile(join(dossier, rel));
    const h = empreinte(contenu);
    manifeste[rel] = h;
    octets += contenu.length;
    const cible = `sites/${site}/${n}/${rel}`;
    if (ancien[rel] === h) { await stockage.copier(`sites/${site}/${precedente}/${rel}`, cible); recopies++; }
    else { await stockage.ecrire(cible, contenu); envoyes++; }
  }
  // Le manifeste s'écrit en dernier : une version sans manifeste est incomplète.
  await stockage.ecrire(`sites/${site}/${n}/${MANIFESTE}`, Buffer.from(JSON.stringify(manifeste)));

  // 3. Basculer les adresses.
  for (const hote of hotes) await adresses.ecrire(hote, { site, version: n });

  // 4. Ne garder que les dernières versions.
  const toutes = [...versions, n];
  for (const v of toutes.slice(0, Math.max(0, toutes.length - VERSIONS_GARDEES))) {
    await stockage.supprimerPrefixe(`sites/${site}/${v}/`);
  }

  return { publie: true, version: n, fichiers: fichiers.length, envoyes, recopies, octets };
}

// Versions complètes d'un site (celles qui ont leur manifeste), croissantes.
export async function versionsDe(stockage, site) {
  const cles = await stockage.lister(`sites/${site}/`);
  const v = new Set();
  for (const c of cles) {
    const m = c.match(new RegExp(`^sites/${site}/(\\d+)/${MANIFESTE.replace('.', '\\.')}$`));
    if (m) v.add(Number(m[1]));
  }
  return [...v].sort((a, b) => a - b);
}

// Revenir à une version gardée.
export async function revenir({ site, version, stockage, adresses, hotes }) {
  const versions = await versionsDe(stockage, site);
  if (!versions.includes(version)) throw new Error(`la version ${version} du site ${site} n'est plus gardée`);
  for (const hote of hotes) await adresses.ecrire(hote, { site, version });
  return { version };
}

// ---------------------------------------------------------------- adaptateurs d'essai
// Un dossier qui joue le rôle de R2.
export function stockageDossier(racine) {
  const p = (cle) => {
    if (cle.split('/').some(m => m === '..')) throw new Error('clé refusée : ' + cle);
    return join(racine, ...cle.split('/'));
  };
  return {
    async ecrire(cle, contenu) { await mkdir(dirname(p(cle)), { recursive: true }); await writeFile(p(cle), contenu); },
    async lire(cle) { return readFile(p(cle)); },
    async existe(cle) { return stat(p(cle)).then(() => true, () => false); },
    async copier(de, vers) { await mkdir(dirname(p(vers)), { recursive: true }); await copyFile(p(de), p(vers)); },
    async lister(prefixe) {
      const base = p(prefixe.replace(/\/$/, ''));
      const out = [];
      async function parcourir(d) {
        let entrees; try { entrees = await readdir(d, { withFileTypes: true }); } catch { return; }
        for (const e of entrees) {
          const q = join(d, e.name);
          if (e.isDirectory()) await parcourir(q);
          else out.push(relative(racine, q).split(sep).join('/'));
        }
      }
      await parcourir(base);
      return out.sort();
    },
    async supprimerPrefixe(prefixe) { await rm(p(prefixe.replace(/\/$/, '')), { recursive: true, force: true }); },
  };
}

// Un fichier JSON qui joue le rôle de Workers KV.
export function adressesFichier(chemin) {
  const lire = async () => JSON.parse(await readFile(chemin, 'utf8').catch(() => '{}'));
  return {
    async ecrire(hote, valeur) { const t = await lire(); t[hote] = valeur; await writeFile(chemin, JSON.stringify(t, null, 2)); },
    async lire(hote) { return (await lire())[hote] || null; },
  };
}

// Les liaisons que le Worker attend (env.SITES, env.ADRESSES), branchées sur
// les adaptateurs d'essai : permet d'essayer worker/routeur.js sans Cloudflare.
export function liaisonsEssai(stockage, adresses) {
  return {
    SITES: {
      async get(cle) {
        if (!(await stockage.existe(cle))) return null;
        const contenu = await stockage.lire(cle);
        return { body: contenu, httpEtag: '"' + empreinte(contenu).slice(0, 16) + '"' };
      },
    },
    ADRESSES: { async get(hote) { return adresses.lire(hote); } },
  };
}
