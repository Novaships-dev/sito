// La main de photos d un site.
//
// Le 24 septembre 2026 : trois ravaleurs de Marseille montraient la meme
// facade. Le generateur prenait huit fichiers aux noms fixes et ignorait les
// vingt-cinq autres, dont les quinze de la banque. Deux artisans voisins qui
// montrent le meme chantier, c est pire qu une grille qui se ressemble : la
// photo est la premiere chose qu on regarde.
//
// Ce module distribue une main differente a chaque entreprise, tiree de la
// graine, en evitant ce que les voisins ont deja pris. Rien n est code en dur :
// les candidats se decouvrent par le nom des fichiers, selon la convention du
// plan d images. C est ce qui permet d ouvrir un metier sans toucher au moteur.
//
//   hero, hero-variante-2, ...        les ouvertures
//   avant-01 / apres-01, -02, -03     les paires avant / apres
//   chantier, chantier-2, ...         les vues de chantier
//   geste, geste-2, ...               les gestes du metier
//   detail-<matiere>                  le gros plan qui donne la palette
//   banque/matiere|ambiance|signes    les couches d habillage

const RANGS = {
  hero: /^hero(-[a-z0-9-]+)?$/,
  chantier: /^chantier(-\d+)?$/,
  geste: /^geste(-\d+)?$/,
  detail: /^detail-[a-z0-9-]+$/,
};

export function candidats(sources) {
  const noms = Object.keys(sources);
  const par = (re) => noms.filter(n => re.test(n)).sort();
  const paires = [];
  for (const n of noms) {
    const m = n.match(/^avant-(\d+)$/);
    if (m && sources['apres-' + m[1]]) paires.push(m[1]);
  }
  return {
    hero: par(RANGS.hero),
    chantier: par(RANGS.chantier),
    geste: par(RANGS.geste),
    detail: par(RANGS.detail),
    paires: paires.sort(),
  };
}

// Tire une main. `pris` liste les mains des voisins : meme metier, meme commune.
// Un choix deja pris par un voisin n est repris que s il ne reste rien d autre.
import { moinsPris } from './graine.mjs';

export function distribuer(g, sources, pris = []) {
  const c = candidats(sources);
  // ce que les voisins ont pris a ce rang, avec leur poids (commune : 5)
  const dejaPris = (rang) => pris.filter(m => m && m[rang]).map(m => ({ valeur: m[rang], poids: m.poids || 1 }));

  const tirer = (liste, rang) => liste.length ? moinsPris(g, liste, dejaPris(rang)) : null;

  const hero = tirer(c.hero, 'hero');
  const chantier = tirer(c.chantier, 'chantier');
  const geste = tirer(c.geste, 'geste');
  const detail = tirer(c.detail, 'detail');

  // Deux paires differentes : celle du premier ecran et celle de l ouverture.
  // Si une seule existe, la page n en montre qu une plutot que deux fois la
  // meme, et le controle d unicite le verra.
  const p1 = tirer(c.paires, 'paire1');
  const restantes = c.paires.filter(x => x !== p1);
  const p2 = restantes.length ? moinsPris(g, restantes, dejaPris('paire2')) : null;

  return { hero, chantier, geste, detail, paire1: p1, paire2: p2 };
}

// La main devient la table des roles attendus par le reste du moteur.
export function roles(main) {
  const r = {
    hero: main.hero,
    chantier: main.chantier,
    geste: main.geste,
    detail: main.detail,
    'avant-01': 'avant-' + main.paire1,
    'apres-01': 'apres-' + main.paire1,
  };
  if (main.paire2) {
    r['avant-02'] = 'avant-' + main.paire2;
    r['apres-02'] = 'apres-' + main.paire2;
  }
  return r;
}

// Ce qu il faut, au minimum, pour qu un metier soit jouable.
export function manquants(sources) {
  const c = candidats(sources);
  const trous = [];
  if (!c.hero.length) trous.push('une image hero');
  if (!c.paires.length) trous.push('une paire avant / apres');
  if (!c.chantier.length) trous.push('une vue de chantier');
  if (!c.geste.length) trous.push('un geste du metier');
  if (!c.detail.length) trous.push('un gros plan detail-<matiere>');
  return trous;
}
