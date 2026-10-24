// Une seule description du plan d'images : quel fichier, dans quel dossier,
// quel cadrage, quelle largeur, et quel sujet demander.
//
// Pourquoi un module à part : trois scripts posent la même question et doivent
// recevoir la même réponse — `liste-images.mjs` (la liste à cocher pour
// Fabrice), `verifier-images.mjs` (le contrôle avant fabrication) et, demain,
// la fabrication des lots de prospection. La table des dossiers et des
// largeurs était écrite dans `liste-images.mjs` seulement ; elle y a divergé
// de ce dont le générateur a vraiment besoin.
//
// LA LARGEUR MINIMALE N'EST PAS UN CHIFFRE ROND. C'est la plus grande
// rendition que `generateur/composer.mjs` fabrique à partir du fichier
// (`TAILLES` : `bandeau` [800, 1200, 1600] pour le hero, `grand`
// [600, 900, 1200, 1400] pour tout le reste). En dessous, le site afficherait
// un agrandissement. Les anciens chiffres de `liste-images.mjs` étaient faux
// des deux côtés : 1 300 px pour les vues de chantier et les gestes, que le
// générateur encode jusqu'à 1 400 ; 1 600 px pour les ambiances, qui ne
// passent jamais par le jeu bandeau.
//
// CE QUE LE GÉNÉRATEUR LIT VRAIMENT : `images/<metier>/sources/` et rien
// d'autre (`composer.mjs` ne reçoit que ce dossier). Les trois dossiers de
// `banque/` (matière, ambiance, signes) sont les couches d'habillage prévues
// par `generateur/main-photos.mjs` ; **aucun code ne les lit aujourd'hui**.
// Leur présence est donc exigée (le plan les demande, Fabrice les génère),
// mais leur largeur ne peut pas encore être exigée : elle le sera le jour où
// une couche d'habillage les affichera.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './env.mjs';

// Miroir de `TAILLES` dans generateur/composer.mjs. Si l'un change, l'autre
// doit changer : `verifier-images.mjs` le mesure.
export const PLUS_GRANDE_RENDITION = { bandeau: 1600, grand: 1400 };

export const RANGS = {
  hero: { dossier: 'sources', rapport: [16, 9], large: PLUS_GRANDE_RENDITION.bandeau, lu: true },
  paire: { dossier: 'sources', rapport: [4, 3], large: PLUS_GRANDE_RENDITION.grand, lu: true },
  chantier: { dossier: 'sources', rapport: [4, 3], large: PLUS_GRANDE_RENDITION.grand, lu: true },
  geste: { dossier: 'sources', rapport: [4, 3], large: PLUS_GRANDE_RENDITION.grand, lu: true },
  detail: { dossier: 'sources', rapport: [4, 3], large: PLUS_GRANDE_RENDITION.grand, lu: true },
  matiere: { dossier: 'banque/matiere', rapport: [4, 3], large: PLUS_GRANDE_RENDITION.grand, lu: false },
  ambiance: { dossier: 'banque/ambiance', rapport: [3, 2], large: PLUS_GRANDE_RENDITION.grand, lu: false },
  signes: { dossier: 'banque/signes', rapport: [1, 1], large: PLUS_GRANDE_RENDITION.grand, lu: false },
};

// Les formats que `composer.mjs` accepte dans sources/ : le nom fait foi,
// l'extension non.
export const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

// Le jeu de démarrage : 32 images par métier (2 hero, 3 paires, 3 chantier,
// 5 geste, 8 matière dont le détail principal, 5 ambiance, 3 signes). Décision
// de Fabrice du 23 octobre : les deux nouveaux métiers démarrent à 32, les 54
// viennent ensuite. `complet` rend les 54.
export const JEUX = {
  demarrage: { hero: 2, paires: 3 },
  complet: { hero: Infinity, paires: Infinity },
};

export function plan(chemin = join(RACINE, 'generateur', 'banque', 'plan-images.json')) {
  return JSON.parse(readFileSync(chemin, 'utf8'));
}

export function metier(cle, p = plan()) {
  const m = p.metiers.find((x) => x.cle === cle);
  if (!m) throw new Error(`métier inconnu : ${cle} (connus : ${p.metiers.map((x) => x.cle).join(', ')})`);
  return m;
}

// Rend la liste des images d'un métier, dans l'ordre du plan :
//   { n, fichier, nom, rang, dossier, rapport, large, lu, sujet, paire }
// `nom` est le nom sans extension (celui que le générateur utilise comme rôle),
// `paire` le numéro de la paire pour les avant/après.
export function images(cle, { jeu = 'demarrage', plan: p = plan() } = {}) {
  const m = metier(cle, p);
  const borne = JEUX[jeu];
  if (!borne) throw new Error(`jeu inconnu : ${jeu} (connus : ${Object.keys(JEUX).join(', ')})`);
  const liste = [];
  let n = 0;
  const pousser = (nom, rang, sujet, extra = {}) => {
    const r = RANGS[rang];
    liste.push({ n: ++n, nom, fichier: `${nom}.jpg`, rang, dossier: r.dossier, rapport: r.rapport, large: r.large, lu: r.lu, sujet, ...extra });
  };

  m.hero.slice(0, borne.hero).forEach((s, i) => pousser(i === 0 ? 'hero' : `hero-variante-${i + 1}`, 'hero', s));
  m.paires.slice(0, borne.paires).forEach((paire, i) => {
    const k = String(i + 1).padStart(2, '0');
    pousser(`avant-${k}`, 'paire', paire[0], { paire: k });
    pousser(`apres-${k}`, 'paire', `${paire[1]}  [MEME bâtiment, MEME cadrage que avant-${k}]`, { paire: k });
  });
  m.chantier.forEach((s, i) => pousser(i === 0 ? 'chantier' : `chantier-${i + 1}`, 'chantier', s));
  m.geste.forEach((s, i) => pousser(i === 0 ? 'geste' : `geste-${i + 1}`, 'geste', s));
  m.matiere.forEach((s, i) => {
    if (i === 0) pousser(m.detail, 'detail', `${s}  [sert au mot geant, au WebGL et au prelevement de la palette]`);
    else pousser(`matiere-${String(i + 1).padStart(2, '0')}`, 'matiere', s);
  });
  m.ambiance.forEach((s, i) => pousser(`ambiance-${String(i + 1).padStart(2, '0')}`, 'ambiance', s));
  m.signes.forEach((s, i) => pousser(`signe-${String(i + 1).padStart(2, '0')}`, 'signes', s));
  return liste;
}

export const cadrage = ([a, b]) => `${a}/${b}`;
