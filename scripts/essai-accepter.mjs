#!/usr/bin/env node
// Essai de l'acceptation d'un site (tâche T59, docs/specs/S-MODELES.md).
//
// Ce qu'il mesure, sur des copies des modèles et du registre :
//   - A accepte : son modèle passe « pris » à son SIREN, un nouveau modèle
//     différent de tous le remplace (10 libres), la fiche garde le modèle ;
//   - B, montré sur le même modèle, accepte ensuite : A le garde, B en reçoit
//     un autre libre, et le conflit est dit ;
//   - accepter deux fois ne change rien ;
//   - le modèle pris ne ressort jamais dans un lot (`repartir`) ;
//   - `--tous` ne traite que les fiches « essai lancé » ou « abonné » ;
//   - les modèles restent tous différents (`modeles.mjs --verifier` à 0).
//
//   node scripts/essai-accepter.mjs
//   node scripts/essai-accepter.mjs --contre-essai   (copie qui ne marque pas
//        le modèle pris : doit rougir)
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';
import * as reg from './prospection/registre.mjs';
import { lire as lireModeles } from './prospection/modeles.mjs';
import { repartir } from './prospection/fabriquer-lot.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-accepter-'));

let module = join(RACINE, 'scripts', 'prospection', 'accepter.mjs');
if (CONTRE) {
  // Hors du dépôt ; les imports relatifs pointent le vrai dépôt.
  mkdirSync(join(travail, 'p'));
  let src = readFileSync(module, 'utf8');
  const avant = src;
  // Chaque import relatif est réécrit vers le vrai dépôt.
  src = src.replace("garde.etat = 'pris'; garde.siren = siren;", 'garde.siren = siren;')
    .replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from ${JSON.stringify(pathToFileURL(join(RACINE, 'scripts', 'prospection', rel)).href)}`);
  if (src === avant || src.includes("garde.etat = 'pris'")) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  module = join(travail, 'p', 'accepter.mjs');
  writeFileSync(module, src);
}
const { accepter, accepterTous } = await import(pathToFileURL(module).href);

try {
  const modeles = join(travail, 'modeles');
  cpSync(join(RACINE, 'prospection', 'modeles'), modeles, { recursive: true });
  const avant = lireModeles('ravalement', modeles);
  const m1 = avant.modeles.find((m) => m.etat === 'libre');
  const r = reg.vide();
  const fiche = (siren, nom, modele, statut = 'essai-lance') => {
    reg.inscrire(r, { siren, nom, metier: 'ravalement', commune: 'Marseille', note: 70 }, { jour: '2026-11-04', slug: 'a'.repeat(16), modele });
    r.fiches[siren].statut = statut;
  };
  fiche('480423623', 'Façades Durand', m1.id);
  fiche('732829320', 'Ravalement Martin', m1.id);
  fiche('443061841', 'Enduits Petit', m1.id, 'interesse');

  console.log('\nA accepte');
  const a = accepter(r, '480423623', { jour: '2026-11-04', modeles });
  const apresA = lireModeles('ravalement', modeles);
  const mA = apresA.modeles.find((m) => m.id === m1.id);
  ok(mA.etat === 'pris' && mA.siren === '480423623', 'le modèle montré passe « pris » à son SIREN', `${mA.etat} ${mA.siren}`);
  ok(a.modele === m1.id && r.fiches['480423623'].modele === m1.id && r.fiches['480423623'].modele_pris_le === '2026-11-04', 'la fiche garde son modèle, avec la date');
  ok(apresA.modeles.filter((m) => m.etat === 'libre').length === 10 && a.ajoutes.length === 1, '10 modèles libres après l acceptation, un tiré en plus', `${a.ajoutes.length} ajouté(s)`);
  ok(!repartir(Array.from({ length: 30 }, (_, k) => ({ siren: String(k) })), apresA.modeles).some((e) => e.modele.id === m1.id), 'le modèle pris ne ressort dans aucun lot');
  ok(spawnSync(process.execPath, [join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', 'ravalement', '--dossier', modeles, '--verifier'], { encoding: 'utf8' }).status === 0,
    'tous les modèles restent différents');

  console.log('\nB accepte le même modèle ensuite');
  const b = accepter(r, '732829320', { jour: '2026-11-04', modeles });
  const apresB = lireModeles('ravalement', modeles);
  ok(apresB.modeles.find((m) => m.id === m1.id).siren === '480423623', 'A garde son modèle');
  ok(b.modele !== m1.id && apresB.modeles.find((m) => m.id === b.modele)?.siren === '732829320', 'B en reçoit un autre, pris à son SIREN', b.modele);
  ok(/déjà celui de 480423623/.test(b.conflit || '') && /à refaire et à lui remontrer/.test(b.conflit), 'le conflit est dit', b.conflit || 'rien');
  ok(apresB.modeles.filter((m) => m.etat === 'libre').length === 10, '10 libres encore');

  console.log('\nAccepter deux fois');
  const nb = lireModeles('ravalement', modeles).modeles.length;
  const a2 = accepter(r, '480423623', { jour: '2026-11-05', modeles });
  ok(a2.deja && lireModeles('ravalement', modeles).modeles.length === nb, 'rien ne change');

  console.log('\n--tous');
  fiche('378901946', 'Façades Blanc', lireModeles('ravalement', modeles).modeles.find((m) => m.etat === 'libre').id, 'abonne-mois');
  const tous = accepterTous(r, { jour: '2026-11-04', modeles });
  ok(tous.length === 1 && tous[0].siren === '378901946', 'seule la fiche abonnée et non réservée est traitée', tous.map((x) => x.siren).join(','));
  ok(!r.fiches['443061841'].modele_pris_le, 'un artisan seulement « intéressé » ne réserve rien');
  ok(reg.valider(r).length === 0, 'le registre reste valide', reg.valider(r).join(' ; '));
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;
