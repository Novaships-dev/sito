#!/usr/bin/env node
// Refaire et publier les sites d'abonnés, lancé par GitHub Actions (tâche T45 ;
// décision de Fabrice du 29 oct. 2026 : pas de serveur loué, « le site est
// refait et publié par GitHub Actions, gratuitement »).
//
// Le workflow `.github/workflows/refaire-site.yml` l'appelle quand la base le
// prévient (photo prête, profil, tarifs : déclencheur Supabase →
// `repository_dispatch`), ou à la main. Un tour de `atelier/boucle.mjs` :
// chaque site visé n'est refait que si quelque chose a changé, vérifié, puis
// publié sur Cloudflare Pages (atelier/publier-pages.mjs).
//
// Variables (secrets du dépôt GitHub, posés par lanceurs/SECRETS_GITHUB.bat ;
// sur le PC, le .env) : SUPABASE_URL, SUPABASE_CLE_SERVICE,
// CLOUDFLARE_COMPTE_ID, CLOUDFLARE_JETON_API. Jamais affichées.
//
//   node scripts/refaire-site.mjs --siren 480423623
//   node scripts/refaire-site.mjs --tous
//   node scripts/refaire-site.mjs --siren 480423623 --sec   (dit ce qui serait refait)
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { exiger } from './env.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { tour, aRefaire } from '../atelier/boucle.mjs';
import { publierPages } from '../atelier/publier-pages.mjs';
import { clientCloudflare } from './prospection/cloudflare-pages.mjs';

// Les adresses qui pointent sur le site : la principale de `adresses`, sinon rien
// (Pages rend alors son adresse *.pages.dev, notée dans sites.adresse_en_ligne).
export async function hotesDuSite(sb, site) {
  const a = await sb.lire('adresses', { filtres: { site_id: ['eq', site.id] } });
  return a.filter((x) => x.etat !== 'retiree').sort((x, y) => Number(y.principale) - Number(x.principale)).map((x) => x.hote);
}

export async function refaire({ sb, client, siren = null, sec = false, dire = console.log }) {
  const tous = await sb.lire('sites', siren ? { filtres: { siren: ['eq', siren] } } : {});
  if (!tous.length) { dire(siren ? `aucun site pour ${siren}` : 'aucun site'); return []; }
  if (sec) {
    const out = [];
    for (const s of tous) { const b = await aRefaire(sb, s); out.push({ site: s.id, ...b }); dire(`${s.siren}/${s.metier} : ${b.raison}`); }
    return out;
  }
  const dossier = mkdtempSync(join(tmpdir(), 'sito-refaire-'));
  try {
    const hotes = new Map();
    for (const s of tous) hotes.set(s.id, await hotesDuSite(sb, s));
    return await tour({ sb, sites: tous, hotesDe: (s) => hotes.get(s.id), registre: join(dossier, 'registre.json'), dire,
      publier: ({ site, dossier: d, verifier }) => publierPages({ client, site, dossier: d, verifier }) });
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--siren');
  const siren = i > -1 ? process.argv[i + 1] : null;
  if (!siren && !process.argv.includes('--tous')) { console.error('usage : refaire-site.mjs --siren <SIREN> | --tous [--sec]'); process.exit(2); }
  if (siren && !/^\d{9}$/.test(siren)) { console.error('SIREN invalide : 9 chiffres'); process.exit(2); }
  const v = exiger(['SUPABASE_URL', 'SUPABASE_CLE_SERVICE', 'CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'],
    'refaire et publier le site d un abonné');
  const sb = supabase({ url: v.SUPABASE_URL, cle: v.SUPABASE_CLE_SERVICE });
  const client = clientCloudflare({ compte: v.CLOUDFLARE_COMPTE_ID, jeton: v.CLOUDFLARE_JETON_API });
  const bilan = await refaire({ sb, client, siren, sec: process.argv.includes('--sec') });
  const fautes = bilan.filter((b) => b.statut === 'refusee' || (b.statut === 'erreur' && !b.manquants));
  for (const b of bilan) console.log(JSON.stringify(b));
  process.exitCode = fautes.length ? 1 : 0;
}
