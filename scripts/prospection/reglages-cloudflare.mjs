#!/usr/bin/env node
// Branche la page d'appels sur Cloudflare : l'espace KV `APPELS` et la
// variable `SLUG_APPELS` du projet `sito-demo`. Sans eux, `worker/appels.js`
// sert la page mais refuse d'enregistrer un résultat.
//
// C'était un réglage à poser à la main dans le tableau de bord
// (`.claude/skills/preparer-appels/SKILL.md`, section 4) ; le jeton de F5
// (« Pages : Edit » + « Workers KV Storage : Edit ») suffit à le faire par
// l'API, donc Fabrice n'a pas à le faire.
//
// Idempotent : un espace déjà créé est repris (par son titre), un réglage
// déjà posé est reposé à l'identique. Après le réglage, le projet est relu,
// et ce qui n'y est pas est une faute : jamais « réglé » sans l'avoir relu.
// Les réglages ne valent qu'à partir du dépôt suivant : à lancer **avant**
// `preparer-appels.mjs --sites`.
//
//   node scripts/prospection/reglages-cloudflare.mjs
import { pathToFileURL } from 'node:url';
import { PROJET } from './cloudflare-pages.mjs';
import { appelsSlug } from './preparer-appels.mjs';

export const TITRE_KV = 'sito-appels';
export const LIAISON = 'APPELS';
export const VARIABLE = 'SLUG_APPELS';

// Rend { espace, fautes } ; `fautes` vide = le projet relu porte bien les
// deux réglages, en production et en préversion.
export async function brancherAppels({ client, projet = PROJET, slug, dire = console.log }) {
  if (!/^[a-z0-9]{8,}$/.test(String(slug || ''))) throw new Error('brancherAppels : slug de la page d appels absent ou invalide');

  if (!(await client.projet(projet))) {
    dire(`  le projet « ${projet} » n existe pas encore : création`);
    await client.creerProjet(projet);
  }

  let espace = (await client.espacesKv()).find((e) => e.title === TITRE_KV);
  if (espace) dire(`  espace KV « ${TITRE_KV} » déjà là`);
  else {
    espace = await client.creerEspaceKv(TITRE_KV);
    dire(`  espace KV « ${TITRE_KV} » créé`);
  }
  if (!espace?.id) throw new Error('Cloudflare n a pas rendu l identifiant de l espace KV');

  const conf = {
    kv_namespaces: { [LIAISON]: { namespace_id: espace.id } },
    env_vars: { [VARIABLE]: { type: 'plain_text', value: slug } },
  };
  await client.reglerProjet(projet, { production: conf, preview: conf });

  const relu = await client.projet(projet);
  const fautes = [];
  for (const env of ['production', 'preview']) {
    const c = relu?.deployment_configs?.[env] || {};
    if (c.kv_namespaces?.[LIAISON]?.namespace_id !== espace.id) fautes.push(`${env} : la liaison KV ${LIAISON} n est pas sur l espace ${TITRE_KV}`);
    if (c.env_vars?.[VARIABLE]?.value !== slug) fautes.push(`${env} : la variable ${VARIABLE} n a pas la valeur de prospection/appels.json`);
  }
  return { espace, fautes };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { exiger } = await import('../env.mjs');
  const env = exiger(['CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'],
    'brancher la page d appels sur Cloudflare (double-clic sur lanceurs\\CLE_CLOUDFLARE.bat, action F5)');
  const { clientCloudflare } = await import('./cloudflare-pages.mjs');
  const client = clientCloudflare({ compte: env.CLOUDFLARE_COMPTE_ID, jeton: env.CLOUDFLARE_JETON_API });
  const { fautes } = await brancherAppels({ client, slug: appelsSlug() });
  for (const f of fautes) console.log(`  FAUTE ${f}`);
  console.log(fautes.length ? 'Réglages incomplets : la page d appels ne pourra pas enregistrer.' : `Réglages relus : ${LIAISON} et ${VARIABLE} posés sur « ${PROJET} » (production et préversion).`);
  process.exitCode = fautes.length ? 1 : 0;
}
