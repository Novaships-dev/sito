// Les regles d unicite, partagees par le tirage (tirage.mjs, qui retire quand
// un site ressemble trop a un voisin), le verificateur
// (scripts/verifier-unicite.mjs) et la mesure de capacite
// (scripts/capacite-unicite.mjs). Un seul endroit : ni le tirage ni la mesure
// ne peuvent etre plus indulgents que le controle.
//
// La regle est celle de .claude/skills/_partage/references/tells-design.md :
// « si le meme brief, reformule, produirait le meme resultat, c est un defaut ».

// Les axes compares, dans l ordre de ce que l oeil remarque. Le poids dit
// combien un axe partage rapproche deux sites.
export const AXES = [
  { cle: 'photos', nom: 'la main de photos', poids: 4 },
  { cle: 'famille', nom: 'famille de couleurs', poids: 3 },
  { cle: 'sol', nom: 'sol clair ou nuit', poids: 3 },
  { cle: 'structure', nom: 'ordre et presence des sections', poids: 3 },
  { cle: 'polices', nom: 'appariement de polices', poids: 2 },
  { cle: 'archetype', nom: 'archetype', poids: 2 },
  { cle: 'mot', nom: 'contenu du mot geant', poids: 1 },
  { cle: 'geometrie', nom: 'geometrie', poids: 1 },
];
// Somme des poids : 19. Deux sites qui partagent plus de la moitie de cette
// somme se ressemblent, quoi qu en dise la grille.
export const PLAFOND = 9;
export const TOTAL = AXES.reduce((s, x) => s + x.poids, 0);

// Deux sites sont voisins s ils font le meme metier dans la meme commune ou le
// meme departement (decision de Fabrice, 2 octobre 2026).
export function echelle(a, b) {
  if (a.metier !== b.metier) return null;
  if (a.commune && a.commune === b.commune) return 'meme commune';
  if (a.departement && a.departement === b.departement) return 'meme departement';
  return null;
}

// Tous les constats entre deux sites voisins.
export function comparer(a, b) {
  const ech = echelle(a, b);
  if (!ech) return [];
  const c = [];
  const communs = AXES.filter(x => a[x.cle] !== undefined && a[x.cle] === b[x.cle]);
  const score = communs.reduce((s, x) => s + x.poids, 0);
  if (score > PLAFOND) c.push({ num: 'U1', echelle: ech, score,
    detail: communs.map(x => x.nom + ' : ' + a[x.cle]).join(' | ') });
  if (a.titre && a.titre === b.titre) c.push({ num: 'U2', echelle: ech, detail: 'meme titre : ' + a.titre });
  // U3 : aucune phrase en commun. Deux voisins qui lisent la meme phrase sur
  // leur site le remarquent, et leurs clients aussi. Les intitules de section
  // ne comptent pas : decision de Fabrice du 2 octobre 2026, ils peuvent se
  // repeter.
  if (Array.isArray(a.phrases) && Array.isArray(b.phrases)) {
    const exclus = new Set([...(a.intitules || []), ...(b.intitules || [])]);
    const communes = a.phrases.filter(x => !exclus.has(x) && b.phrases.includes(x));
    if (communes.length) c.push({ num: 'U3', echelle: ech,
      detail: communes.length + ' phrase(s) commune(s) : ' + communes.slice(0, 2).join(' / ') });
  }
  // U4 : jamais le meme comparateur : meme poignee, meme invitation et memes
  // etiquettes a la meme place. Depuis le 2 octobre 2026 les etiquettes en
  // font partie : en haut ou en bas, elles changent ce qu on voit d abord.
  if (a.comparateur && b.comparateur && a.comparateur.prise === b.comparateur.prise
      && a.comparateur.indice === b.comparateur.indice
      && (a.comparateur.etiquettes || 'haut') === (b.comparateur.etiquettes || 'haut'))
    c.push({ num: 'U4', echelle: ech, detail: 'meme comparateur : ' + a.comparateur.prise + ', « ' + a.comparateur.indice + ' », etiquettes en ' + (a.comparateur.etiquettes || 'haut') });
  return c;
}
