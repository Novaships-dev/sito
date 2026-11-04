// Publier le site d'un abonné sur Cloudflare Pages (tâche T45).
//
// Pourquoi Pages et pas R2 : R2 demande une carte bancaire, ne pas s'en servir
// (docs/CONSTRAINTS.md C23) ; Pages est gratuit. Un projet Pages par site
// d'abonné (`sito-<siren>-<métier>`) : chaque dépôt Pages est une version
// complète et atomique ; le précédent reste dans l'historique du projet, on
// y revient depuis le tableau de bord. Pas de mélange de versions possible :
// le dépôt bascule d'un coup.
//
// Rien ne part si le vérificateur refuse. Les appels sont ceux de
// `scripts/prospection/cloudflare-pages.mjs` (envoi direct), essayés contre
// `scripts/faux-cloudflare.mjs`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { empreinte } from '../scripts/prospection/cloudflare-pages.mjs';

// Les en-têtes d'un site d'abonné : sécurité, et aucun noindex (le site doit
// se trouver sur Google, docs/specs/S-REFERENCEMENT.md).
export const ENTETES_ABONNE = '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n';

export const projetDe = (site) => `sito-${site.siren}-${site.metier}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 58);

function fichiers(dossier) {
  const out = [];
  const parcourir = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (n !== 'donnees.json' && n !== 'sirene.json' && n !== 'modele.json') out.push(p);
    }
  };
  parcourir(dossier);
  return out;
}

// Rend { publie, motif?, bloquants?, version, url, id, fichiers, octets, envoyes, recopies }.
export async function publierPages({ client, site, dossier, verifier }) {
  const verdict = await verifier(dossier);
  if (!verdict.ok) return { publie: false, motif: 'vérificateur', bloquants: verdict.bloquants || [] };
  const projet = projetDe(site);
  const manifeste = {}, aEnvoyer = new Map();
  let octets = 0;
  for (const f of fichiers(dossier)) {
    const chemin = relative(dossier, f).split(sep).join('/');
    const contenu = readFileSync(f);
    const cle = await empreinte(contenu, chemin);
    manifeste['/' + chemin] = cle;
    aEnvoyer.set(cle, { cle, contenu, chemin });
    octets += contenu.length;
  }
  if (!(await client.projet(projet))) await client.creerProjet(projet);
  const jwt = await client.jetonTeleversement(projet);
  const toutes = [...new Set(Object.values(manifeste))];
  const manquants = await client.manquants(jwt, toutes);
  const envoyes = manquants.length ? await client.televerser(jwt, manquants.map((h) => aEnvoyer.get(h))) : 0;
  if (manquants.length) await client.confirmerEmpreintes(jwt, manquants);
  const { id, url } = await client.deployer(projet, { manifeste, entetes: ENTETES_ABONNE });
  return { publie: true, version: (site.version || 0) + 1, url, id, projet,
    fichiers: Object.keys(manifeste).length, octets, envoyes, recopies: toutes.length - manquants.length };
}
