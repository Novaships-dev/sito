#!/usr/bin/env node
// Essai des mentions légales d'un site d'abonné (tâche T50, constat S-004,
// docs/specs/S-MENTIONS.md).
//
// Ce qu'il mesure :
//   - un site d'abonné (`--publication`), sur chacun des quatre archétypes,
//     a sa page `mentions-legales.html` qui montre chaque valeur donnée
//     (Sirene et profil), un lien vers elle dans le pied de chaque page, le
//     médiateur près du contact, et passe `verifier-site` ;
//   - ce qui n'est pas donné se dit « Non renseigné », rien n'est inventé ;
//   - une mention obligatoire pour tous qui manque (téléphone, adresse
//     électronique, siège, directeur de la publication) arrête la
//     fabrication et se nomme ;
//   - le directeur de la publication vient du profil, sinon du dirigeant
//     donné par l'annuaire, sinon de l'entrepreneur individuel ;
//   - un site de prospection n'a ni la page ni le lien ;
//   - le contrôle ML de `verifier-site` rougit sur une copie sans la page,
//     sans le lien, ou sans une mention.
//
//   node scripts/essai-mentions.mjs
//   node scripts/essai-mentions.mjs --contre-essai   (générateur copié qui
//        n'arrête plus la fabrication quand une mention manque : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

const travail = mkdtempSync(join(tmpdir(), 'sito-mentions-'));
let GEN = join(RACINE, 'generateur');
if (CONTRE) {
  // Hors du dépôt (piège du 21 octobre) ; node_modules en lien pour sharp.
  GEN = join(travail, 'generateur');
  cpSync(join(RACINE, 'generateur'), GEN, { recursive: true });
  symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
  const f = join(GEN, 'sections', 'mentions.mjs');
  const avant = readFileSync(f, 'utf8');
  const apres = avant.replace('if (vide && obligatoire) manque.push(', 'if (false) manque.push(');
  if (apres === avant) { console.error('la copie cassée n a rien cassé : mentions.mjs a changé de forme.'); process.exit(2); }
  writeFileSync(f, apres);
}

const image = (r, g, b) => sharp({ create: { width: 640, height: 480, channels: 3, background: { r, g, b } } }).jpeg().toBuffer();
const dossierImages = join(travail, 'images');
mkdirSync(dossierImages);
for (const [nom, c] of Object.entries({ hero: [200, 190, 170], 'avant-01': [120, 110, 100], 'apres-01': [230, 225, 210],
  chantier: [140, 90, 60], geste: [90, 90, 90], 'detail-enduit': [200, 180, 150] }))
  writeFileSync(join(dossierImages, `${nom}.jpg`), await image(...c));

const PROFIL = {
  courriel: 'contact@facades-essai.fr', capital_social: '12 500 €', immatriculation: 'RCS Marseille 480 423 623',
  tva_intra: 'FR12480423623', directeur_publication: 'Jeanne Essai',
  decennale_assureur: 'Assurances Essai', decennale_contrat: 'DEC-2026-001', decennale_zone: 'France métropolitaine',
  mediateur_nom: 'Médiateur Essai', mediateur_adresse: '1 rue de la Médiation, 75001 Paris', mediateur_site: 'https://mediateur.example',
};
const brut = (siren, { mentions = PROFIL, telephone = '0491234567', nature = '5710', adresse = '10 rue du Test', dirigeants } = {}) => ({
  siren, nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai',
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: nature,
  tranche_effectif_salarie: '03', complements: { est_rge: true },
  siege: { siret: siren + '00017', adresse, libelle_commune: 'Marseille', code_postal: '13001' },
  telephone, mentions, ...(dirigeants ? { dirigeants } : {}),
});

let n = 0;
const fabriquer = (siren, donnees, { publication = true } = {}) => {
  const sortie = join(travail, `site-${++n}`);
  const fichier = join(travail, `donnees-${n}.json`);
  writeFileSync(fichier, JSON.stringify(donnees));
  const args = [join(GEN, 'composer.mjs'), '--siren', siren, '--metier', 'ravalement', '--images', dossierImages,
    '--sortie', sortie, '--donnees', fichier, '--registre', join(travail, `registre-${n}.json`)];
  if (publication) args.push('--publication');
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE });
  return { r, sortie };
};
const verifier = (dossier) => spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), dossier], { encoding: 'utf8' });
const lire = (d, f) => readFileSync(join(d, f), 'utf8');
const pagesDe = (d) => ['index.html', 'le-travail.html', 'mentions-legales.html'].filter((p) => existsSync(join(d, p)));

try {
  console.log('\nSites d abonné, les quatre archétypes');
  // Dans cet ordre, les quatre premiers donnent les quatre archétypes (tirage
  // du 3 nov. 2026) ; les suivants servent si le tirage change.
  const SIRENS = ['480423623', '732829320', '443061841', '350000105', '552100554', '378901946', '642050199', '316300182',
    '409785512', '820043784', '512345671', '799088410'];
  const vus = new Map();
  for (const siren of SIRENS) {
    if (vus.size === 4) break;
    const { r, sortie } = fabriquer(siren, brut(siren));
    if (!ok(r.status === 0, `fabrication ${siren}`, (r.stderr || '').trim().split('\n').slice(-1)[0])) continue;
    const arch = JSON.parse(lire(sortie, 'donnees.json')).archetype;
    if (vus.has(arch)) continue;
    vus.set(arch, sortie);
    console.log(`  (${siren} : ${arch})`);
    const ml = existsSync(join(sortie, 'mentions-legales.html')) ? lire(sortie, 'mentions-legales.html') : '';
    ok(ml.length > 0, `${arch} : mentions-legales.html écrite`);
    const attendus = ['Façades Essai', 'SAS, société par actions simplifiée', '12 500 €', '10 rue du Test, 13001 Marseille',
      '04 91 23 45 67', 'contact@facades-essai.fr', 'RCS Marseille 480 423 623', `${siren.replace(/(\d{3})(?=\d)/g, '$1 ')} 00017`, 'FR12480423623',
      'Jeanne Essai', 'Cloudflare, Inc.', '101 Townsend Street', '+1 888 993 5273', 'Médiateur Essai',
      '1 rue de la Médiation, 75001 Paris', 'https://mediateur.example', 'Assurances Essai', 'DEC-2026-001', 'France métropolitaine'];
    const absents = attendus.filter((a) => !ml.includes(a));
    ok(absents.length === 0, `${arch} : chaque valeur donnée est sur la page`, absents.join(' | '));
    ok(!ml.includes('Non renseigné</td>'), `${arch} : aucune ligne « Non renseigné » quand tout est donné`);
    const sansLien = pagesDe(sortie).filter((p) => !lire(sortie, p).includes('href="mentions-legales.html"'));
    ok(sansLien.length === 0, `${arch} : lien « Mentions légales » sur chaque page (${pagesDe(sortie).length})`, sansLien.join(', '));
    const accueil = lire(sortie, 'index.html');
    ok(/data-ml="ML10">Médiateur de la consommation : Médiateur Essai, 1 rue de la Médiation/.test(accueil), `${arch} : médiateur près du contact de l accueil`);
    ok(accueil.includes('<meta name="atelier-regime" content="abonne">') && !accueil.includes('Proposition de site'),
      `${arch} : régime abonné, pas de « Proposition de site »`);
    const dits = pagesDe(sortie).filter((p) => /exemple|Proposition de site/i.test(lire(sortie, p).replace(/<head>[\s\S]*?<\/head>/, '')));
    ok(dits.length === 0, `${arch} : photos de l artisan, aucune page ne dit « exemple » ni « proposition » (T54)`, dits.join(', '));
    const v = verifier(sortie);
    ok(v.status === 0, `${arch} : verifier-site à 0`, (v.stdout || '').trim().split('\n').slice(-3).join(' | '));
  }
  ok(vus.size === 4, 'les quatre archétypes essayés', [...vus.keys()].join(', '));

  console.log('\nCe qui manque se dit, rien n est inventé');
  const { r: rp, sortie: sp } = fabriquer('480423623', brut('480423623', { mentions: { courriel: 'a@b.fr', directeur_publication: 'Jeanne Essai' } }));
  if (ok(rp.status === 0, 'profil minimal : fabriqué')) {
    const t = lire(sp, 'mentions-legales.html');
    ok(/Capital social<\/th><td class="vide">Non renseigné/.test(t), 'capital absent : « Non renseigné »');
    ok(/Médiateur de la consommation<\/th><td class="vide">Non renseigné/.test(t), 'médiateur absent : « Non renseigné »');
    ok(!t.includes('TVA intracommunautaire'), 'TVA absente : aucune ligne, jamais un numéro calculé');
    ok(t.includes('SIREN 480 423 623, registre national des entreprises (RNE)'), 'immatriculation non saisie : SIREN et RNE');
    ok(!t.includes('Assurance décennale'), 'décennale absente : aucune ligne');
    ok(lire(sp, 'index.html').includes('Médiateur de la consommation : Non renseigné.'), 'accueil : médiateur « Non renseigné »');
  }

  console.log('\nLe directeur de la publication');
  const { r: rd, sortie: sd } = fabriquer('480423623', brut('480423623', { mentions: { courriel: 'a@b.fr' },
    dirigeants: [{ type_dirigeant: 'personne morale', denomination: 'Holding' }, { type_dirigeant: 'personne physique', nom: 'MARTIN', prenoms: 'Paul' }] }));
  ok(rd.status === 0 && lire(sd, 'mentions-legales.html').includes('Paul MARTIN'), 'sans saisie : le dirigeant personne physique de l annuaire');
  const { r: re, sortie: se } = fabriquer('480423623', { ...brut('480423623', { mentions: { courriel: 'a@b.fr' }, nature: '1000' }),
    nom_raison_sociale: 'DUPONT JEAN', nom_complet: 'DUPONT JEAN' });
  if (ok(re.status === 0, 'entrepreneur individuel sans saisie : fabriqué', (re.stderr || '').trim())) {
    const t = lire(se, 'mentions-legales.html');
    ok(/Directeur de la publication<\/th><td>DUPONT JEAN/.test(t) && t.includes('DUPONT JEAN, entrepreneur individuel (EI)'),
      'entrepreneur individuel : son nom, suivi de « entrepreneur individuel (EI) »');
    ok(!t.includes('Capital social') && !t.includes('Forme juridique'), 'entrepreneur individuel : ni capital ni forme');
  }

  console.log('\nUne mention obligatoire manque : pas de site');
  for (const [quoi, donnees, nom] of [
    ['sans téléphone', brut('480423623', { telephone: null }), 'ML5 Téléphone'],
    ['sans adresse électronique', brut('480423623', { mentions: { ...PROFIL, courriel: undefined } }), 'ML5 Adresse électronique'],
    ['sans siège', brut('480423623', { adresse: null }), 'ML4 Siège'],
    ['sans directeur de la publication', brut('480423623', { mentions: { ...PROFIL, directeur_publication: undefined } }), 'ML9 Directeur de la publication'],
  ]) {
    const { r, sortie } = fabriquer('480423623', donnees);
    ok(r.status === 2 && r.stderr.includes(nom) && !existsSync(join(sortie, 'index.html')),
      `${quoi} : fabrication arrêtée, « ${nom} » nommé`, `sortie ${r.status} ${(r.stderr || '').trim().slice(0, 120)}`);
  }

  console.log('\nSite de prospection');
  const { r: rq, sortie: sq } = fabriquer('480423623', brut('480423623'), { publication: false });
  if (ok(rq.status === 0, 'prospection : fabriqué')) {
    ok(!existsSync(join(sq, 'mentions-legales.html')), 'prospection : pas de page de mentions');
    const t = lire(sq, 'index.html');
    ok(!t.includes('mentions-legales.html') && t.includes('Proposition de site') && t.includes('content="prospection"'),
      'prospection : ni lien ni médiateur, « Proposition de site », régime prospection');
    ok(verifier(sq).status === 0, 'prospection : verifier-site à 0 (le contrôle ML ne s y applique pas)');
    ok(/data-exemple="oui"/.test(t) && /alt="Exemple, /.test(t),
      'prospection : les photos sont dites « exemple » (alt et marquage) (T54)');
  }

  console.log('\nLe contrôle ML de verifier-site, sur des copies cassées');
  const sain = vus.get('matiere') || [...vus.values()][0];
  if (sain) {
    const copie = (nom, casser) => { const d = join(travail, `casse-${nom}`); cpSync(sain, d, { recursive: true }); casser(d); return d; };
    const sansPage = copie('page', (d) => rmSync(join(d, 'mentions-legales.html')));
    ok(verifier(sansPage).status === 1 && /page mentions-legales\.html absente/.test(verifier(sansPage).stdout), 'sans la page : rouge');
    const sansLien = copie('lien', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace(/href="mentions-legales\.html"/g, 'href="#"')));
    ok(verifier(sansLien).status === 1 && /aucun lien vers les mentions legales/.test(verifier(sansLien).stdout), 'sans le lien sur l accueil : rouge');
    const sansMl = copie('ml', (d) => writeFileSync(join(d, 'mentions-legales.html'), lire(d, 'mentions-legales.html').replace(/data-ml="ML8"/g, 'data-ml="X"')));
    ok(verifier(sansMl).status === 1 && /mention\(s\) absente\(s\) : ML8/.test(verifier(sansMl).stdout), 'sans l hébergeur : rouge');
    const ditExemple = copie('exemple', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('<img ', '<img data-exemple="oui" ')));
    ok(verifier(ditExemple).status === 1 && /\[BLOQUANT\] R-EXEMPLE/.test(verifier(ditExemple).stdout), 'photo de l artisan marquée « exemple » : R-EXEMPLE rouge (T54)');
    const sansMed = copie('med', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace(/data-ml="ML10"/g, 'data-x')));
    ok(verifier(sansMed).status === 1 && /mediateur de la consommation absent/.test(verifier(sansMed).stdout), 'sans le médiateur sur l accueil : rouge');
  }
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
