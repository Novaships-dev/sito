#!/usr/bin/env node
// Les photos qu'un artisan envoie par mail ou WhatsApp deviennent son site
// (tâche T60, docs/specs/S-MODELES.md MO7 ; décisions de Fabrice du 4 nov.
// 2026 : « il envoie ces photos par mail ou whatsapp pour que je puisse avec
// l'aide de Claude ajouter a sont site », et Q6 : « Le repo github Sito sera
// privé donc sur Sito github »). Procédure pour Fabrice : docs/PROCEDURE-PHOTOS.md.
//
// Trois temps, dans le dossier `clients/<SIREN>/` du dépôt :
//   1. --ranger  : les photos en vrac sont préparées (redressées, sans GPS ni
//      appareil, JPEG) dans `photos/`, et `photos.json` les liste, rôle vide ;
//   2. le rôle de chaque photo (avant, apres, chantier, geste, detail ; une
//      paire avant/après porte le même numéro) est écrit dans `photos.json`,
//      par Claude qui les regarde, ou par Fabrice ;
//   3. --fabriquer : le site d'abonné est refait sur le modèle de l'artisan,
//      avec ses photos (`--publication` : mentions légales, référencement,
//      aucun « exemple »), dans `sites/clients/<SIREN>/`.
//
// Garde : tant que le dépôt est public, aucune photo n'entre dans `clients/`.
//
//   node scripts/prospection/photos-artisan.mjs --siren <S> --ranger <dossier>
//   node scripts/prospection/photos-artisan.mjs --siren <S> --fabriquer
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import { preparerPhoto, Illisible } from '../../atelier/photos.mjs';
import * as registreAppels from './registre.mjs';
import { lire as lireModeles, charteDe } from './modeles.mjs';

export const ROLES = ['avant', 'apres', 'chantier', 'geste', 'detail'];
const DEPOT = 'Novaships-dev/sito';

// Le dépôt est-il privé ? Sans réponse sûre, on dit non : une photo d'artisan
// dans un dépôt public ne se retire plus de l'historique.
export function depotPrive() {
  try {
    const r = execFileSync('gh', ['api', `repos/${DEPOT}`, '--jq', '.private'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return r === 'true';
  } catch { return false; }
}

// Les photos en vrac : préparées, numérotées, listées. Rend { manifeste, refus }.
export async function ranger({ siren, source, clients = join(RACINE, 'clients'), prive = depotPrive }) {
  if (!prive()) throw new Error('le dépôt sito est encore public (ou GitHub ne répond pas) : aucune photo d artisan n y entre. Action F20');
  const dossier = join(clients, siren);
  const photos = join(dossier, 'photos');
  mkdirSync(photos, { recursive: true });
  const fichierManifeste = join(dossier, 'photos.json');
  const manifeste = existsSync(fichierManifeste) ? JSON.parse(readFileSync(fichierManifeste, 'utf8')) : { siren, photos: [] };
  const refus = [];
  const deja = new Set(manifeste.photos.map((p) => p.origine));
  for (const f of readdirSync(source).filter((x) => statSync(join(source, x)).isFile() && !x.startsWith('.')).sort()) {
    if (deja.has(f)) continue;
    try {
      const p = await preparerPhoto(readFileSync(join(source, f)), { nom: f });
      if (p.video) { refus.push({ origine: f, motif: 'vidéo : gardée par l app plus tard, pas sur le site' }); continue; }
      if (p.attente) { refus.push({ origine: f, motif: 'photo HEIC : demander à l artisan de la renvoyer par WhatsApp (qui l envoie en JPEG) ou en « le plus compatible »' }); continue; }
      const nom = `${String(manifeste.photos.length + 1).padStart(2, '0')}.jpg`;
      writeFileSync(join(photos, nom), p.image);
      manifeste.photos.push({ fichier: nom, origine: f, largeur: p.largeur, hauteur: p.hauteur, role: null, paire: null });
    } catch (e) {
      refus.push({ origine: f, motif: e instanceof Illisible ? e.motif : e.message.split('\n')[0] });
    }
  }
  manifeste.refus = [...(manifeste.refus || []).filter((r) => !refus.some((x) => x.origine === r.origine)), ...refus];
  writeFileSync(fichierManifeste, JSON.stringify(manifeste, null, 2) + '\n');
  return { manifeste, refus };
}

// Ce qui manque pour fabriquer, en français. Vide : tout y est.
export function manquants(manifeste) {
  const m = [];
  const ph = manifeste.photos || [];
  const sansRole = ph.filter((p) => !ROLES.includes(p.role));
  if (sansRole.length) m.push(`${sansRole.length} photo(s) sans rôle : ${sansRole.slice(0, 4).map((p) => p.fichier).join(', ')}`);
  const paires = new Set(ph.filter((p) => p.role === 'avant' && ph.some((q) => q.role === 'apres' && q.paire === p.paire && p.paire != null)).map((p) => p.paire));
  if (!paires.size) m.push('aucune paire avant / après (même numéro de paire)');
  for (const r of ['chantier', 'geste', 'detail']) if (!ph.some((p) => p.role === r)) m.push(`aucune photo « ${r} »`);
  return m;
}

// Les fichiers au nom de rôle que le générateur attend.
export function rolesFichiers(manifeste, metier) {
  const ph = manifeste.photos;
  const out = {};
  const paires = [...new Set(ph.filter((p) => p.role === 'avant').map((p) => p.paire))].filter((n) => ph.some((q) => q.role === 'apres' && q.paire === n)).sort((a, b) => a - b);
  paires.forEach((n, i) => {
    const k = String(i + 1).padStart(2, '0');
    out[`avant-${k}`] = ph.find((p) => p.role === 'avant' && p.paire === n).fichier;
    out[`apres-${k}`] = ph.find((p) => p.role === 'apres' && p.paire === n).fichier;
  });
  out.hero = out['apres-01'];
  ph.filter((p) => p.role === 'chantier').forEach((p, i) => { out[i ? `chantier-${i + 1}` : 'chantier'] = p.fichier; });
  ph.filter((p) => p.role === 'geste').forEach((p, i) => { out[i ? `geste-${i + 1}` : 'geste'] = p.fichier; });
  ph.filter((p) => p.role === 'detail').forEach((p, i) => { out[i ? `detail-${metier}-${i + 1}` : `detail-${metier}`] = p.fichier; });
  return out;
}

// Le site d'abonné, sur le modèle pris par l'artisan.
export function fabriquer({ siren, clients = join(RACINE, 'clients'), appels = registreAppels.CHEMIN, modeles, sortie = null, dire = console.log }) {
  const dossier = join(clients, siren);
  const manifeste = JSON.parse(readFileSync(join(dossier, 'photos.json'), 'utf8'));
  const trous = manquants(manifeste);
  if (trous.length) return { ok: false, manquants: trous };
  const f = registreAppels.lire(appels).fiches[siren];
  if (!f || !f.modele) return { ok: false, manquants: [`${siren} : aucun modèle au registre des appels`] };
  const modele = lireModeles(f.metier, modeles).modeles.find((m) => m.id === f.modele);
  if (!modele || modele.etat !== 'pris' || modele.siren !== siren)
    return { ok: false, manquants: [`le modèle ${f.modele} n est pas encore réservé à ${siren} : node scripts/prospection/accepter.mjs --siren ${siren}`] };
  const fichierEntreprise = join(dossier, 'entreprise.json');
  if (!existsSync(fichierEntreprise)) return { ok: false, manquants: [`clients/${siren}/entreprise.json absent (réponse Sirene, téléphone, adresse électronique, directeur de la publication)`] };

  const travail = join(dossier, '.travail');
  rmSync(travail, { recursive: true, force: true });
  const images = join(travail, 'images');
  mkdirSync(images, { recursive: true });
  const base = f.metier;
  for (const [role, fichier] of Object.entries(rolesFichiers(manifeste, base)))
    copyFileSync(join(dossier, 'photos', fichier), join(images, `${role}.jpg`));
  writeFileSync(join(travail, 'charte.json'), JSON.stringify(charteDe(modele)));
  const cible = sortie || join(RACINE, 'sites', 'clients', siren);
  mkdirSync(cible, { recursive: true });
  const args = [join(RACINE, 'generateur', 'composer.mjs'), '--siren', siren, '--metier', f.metier, '--images', images,
    '--sortie', cible, '--donnees', fichierEntreprise, '--registre', join(travail, 'registre.json'),
    '--charte', join(travail, 'charte.json'), '--graine', modele.id, '--publication'];
  const adresse = JSON.parse(readFileSync(fichierEntreprise, 'utf8')).adresse_publique;
  if (adresse) args.push('--adresse', adresse);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE });
  rmSync(travail, { recursive: true, force: true });
  if (r.status !== 0) return { ok: false, manquants: [(r.stderr || r.stdout || '').trim().split('\n').slice(-1)[0]] };
  const v = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), cible], { encoding: 'utf8' });
  dire(v.stdout.trim().split('\n').slice(-2).join('\n'));
  return { ok: v.status === 0, sortie: cible, modele: modele.id, verifier: v.status };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const val = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
  const siren = val('siren');
  if (!/^\d{9}$/.test(siren || '')) { console.error('usage : photos-artisan.mjs --siren <9 chiffres> (--ranger <dossier> | --fabriquer)'); process.exit(2); }
  try {
    if (val('ranger')) {
      const { manifeste, refus } = await ranger({ siren, source: val('ranger') });
      console.log(`${manifeste.photos.length} photo(s) dans clients/${siren}/photos ; ${refus.length} refusée(s)`);
      for (const x of refus) console.log(`  refusée : ${x.origine} : ${x.motif}`);
      console.log(`Rôles à écrire dans clients/${siren}/photos.json (avant, apres, chantier, geste, detail ; paire 1, 2…), puis --fabriquer.`);
    } else if (process.argv.includes('--fabriquer')) {
      const r = fabriquer({ siren });
      if (!r.ok) { console.error('Rien n est fabriqué :\n  ' + (r.manquants || [`verifier-site sort ${r.verifier}`]).join('\n  ')); process.exit(2); }
      console.log(`Site de ${siren} refait sur le modèle ${r.modele} : ${r.sortie}`);
    } else { console.error('--ranger <dossier> ou --fabriquer'); process.exit(2); }
  } catch (e) { console.error('Refus : ' + e.message); process.exit(2); }
}
