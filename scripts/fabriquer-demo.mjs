// Refabrique les sites de démonstration et les passe aux cinq vérificateurs.
// S'arrête à la première erreur : une fabrication qui échoue n'écrase jamais
// un site déjà livré sans le dire. Voir rules/methode.md.
//
//   node scripts/fabriquer-demo.mjs [--rapide]
//
// --rapide : saute les vérificateurs ordinateur et téléphone, qui ouvrent un
// vrai navigateur et prennent plusieurs minutes.
//
// Attend les photos dans images/<metier>/sources/ (dossier non versionné) et
// les données Sirene dans donnees/entreprises-demo/<siren>.json.
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const rapide = process.argv.includes('--rapide');
const METIER = 'ravalement';
const photos = join(racine, 'images', METIER, 'sources');
const dossierDonnees = join(racine, 'donnees', 'entreprises-demo');

function lancer(titre, script, args) {
  process.stdout.write(`\n--- ${titre}\n`);
  const r = spawnSync(process.execPath, [join(racine, script), ...args], { cwd: racine, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nARRET : ${titre} a échoué (sortie ${r.status}). Rien de plus n'est fabriqué.`);
    process.exit(r.status || 1);
  }
}

if (!existsSync(photos)) {
  console.error(`Photos introuvables : ${photos}`);
  console.error('Les images ne sont pas dans Git. Voir banque/README.md pour savoir où les ranger.');
  process.exit(2);
}

lancer('dépôt complet', 'scripts/verifier-depot.mjs', ['.']);

const sirens = readdirSync(dossierDonnees).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
for (const siren of sirens) {
  const nom = JSON.parse(readFileSync(join(dossierDonnees, siren + '.json'), 'utf8')).nom_complet || siren;
  const sortie = join('sites', siren);
  lancer(`fabrication ${nom}`, 'generateur/composer.mjs', [
    '--siren', siren, '--metier', METIER, '--images', photos,
    '--sortie', sortie, '--donnees', join(dossierDonnees, siren + '.json')]);
  lancer(`plancher ${nom}`, 'scripts/verifier-site.mjs', [sortie]);
  if (!rapide) {
    lancer(`ordinateur ${nom}`, 'scripts/verifier-ordinateur.mjs', [sortie]);
    lancer(`téléphone ${nom}`, 'scripts/verifier-mobile.mjs', [sortie]);
  }
}
lancer('unicité entre voisins', 'scripts/verifier-unicite.mjs', ['sites']);

// Une version en un seul fichier par site, à ouvrir sur un téléphone sans
// serveur : c'est ce que Fabrice montre. Ce n'est pas le format de publication.
process.stdout.write('\n--- fichiers uniques\n');
for (const siren of sirens) {
  const r = spawnSync(process.execPath, [join(racine, 'scripts/fichier-unique.mjs'), join('sites', siren)],
    { cwd: racine, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) { console.error(`ARRET : fichier unique ${siren} (sortie ${r.status})`); process.exit(1); }
  writeFileSync(join(racine, 'sites', siren + '.html'), r.stdout);
  console.log(`sites/${siren}.html`);
}

console.log(`\nTERMINÉ : ${sirens.length} sites fabriqués dans sites/, ${rapide ? 'plancher et unicité' : 'cinq vérificateurs'} à zéro.`);
