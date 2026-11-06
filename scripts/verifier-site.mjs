#!/usr/bin/env node
// Verification deterministe d'une page construite, contre les regles d'atelier.
// Usage : node scripts/verifier-site.mjs <chemin> [--json]
// Sortie 1 si un constat bloquant est trouve, 0 sinon.
//
// Ce script dit NON. Il ne dit jamais quoi faire a la place au-dela du remede
// ecrit dans le catalogue. La forme reste libre : voir rules/web/design-interdits.md,
// section « test d'unicite ».

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const EXT = new Set(['.html', '.astro', '.jsx', '.tsx', '.vue', '.css', '.liquid']);
const EXCLUS = ['node_modules', '.git', 'dist', 'build', 'docs', 'rules', 'references'];

// ---------------------------------------------------------------- budgets
const BUDGETS = { page: 1_500_000, css: 100_000, js: 300_000 };

// ------------------------------------------------------- palette bannie F1
const HEX_BANNIS = [
  'f5f1ea','f7f5f1','fbf8f1','efeae0','ece6db','faf7f1','e8dfcb','f4f1ea',
  'b08947','b6553a','9a2436','9c6e2a','bc7c3a','7d5621','d97757',
  '1a1714','1a1814','1b1814',
];

// ---------------------------------------------------------------- le catalogue
const REGLES = [
  { num: '01', gravite: 'avertissement', libelle: 'degrade violet ou noir',
    motif: /linear-gradient\([^)]*(#[89ab][0-9a-f]{2}[0-9a-f]{3}|purple|violet|indigo)/gi,
    remede: 'aplat, ou photo' },

  { num: '11', gravite: 'bloquant', libelle: 'verre liquide, backdrop-filter',
    motif: /backdrop-filter\s*:/gi, remede: 'aplat' },

  { num: '17', gravite: 'bloquant', libelle: 'police par defaut du modele',
    motif: /(font-family|family=|fontFamily)[^;>"']{0,80}\b(Inter|Geist|Space Grotesk|Poppins|Montserrat|Fraunces|Instrument[_ ]Serif)\b/gi,
    remede: 'Archivo, Public Sans, Libre Franklin, Bricolage Grotesque' },

  { num: '20', gravite: 'bloquant', libelle: 'emoji dans un titre',
    motif: /<h[1-4][^>]*>[^<]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, remede: 'retirer' },

  { num: '26', gravite: 'bloquant', libelle: 'tiret cadratin',
    motif: /—/g, remede: 'trait d union, ou reformuler' },

  { num: '27', gravite: 'bloquant', libelle: 'palette beige laiton espresso, famille F1',
    motif: new RegExp('#(' + HEX_BANNIS.join('|') + ')\\b', 'gi'),
    remede: 'voir .claude/skills/_partage/references/palettes.md, sept familles de rotation' },

  { num: '32', gravite: 'avertissement', libelle: 'bibliotheque d icones par defaut',
    motif: /(lucide-react|lucide|@heroicons|heroicons)/gi,
    remede: 'Phosphor, HugeIcons, Radix ou Tabler, une seule famille' },

  { num: '33', gravite: 'avertissement', libelle: 'intitule en capitales espacees',
    motif: /class="[^"]*(uppercase[^"]*tracking|tracking[^"]*uppercase)/gi,
    remede: 'plafond : nombre de sections divise par trois' },

  { num: '34', gravite: 'bloquant', libelle: 'point median separateur',
    motif: /\s·\s/g, remede: 'virgule, ou retour a la ligne' },

  { num: '37', gravite: 'avertissement', libelle: 'indice de defilement',
    motif: /(scroll-indicator|animate-bounce|Defiler|Scroll down)/gi, remede: 'rien' },

  { num: '45', gravite: 'bloquant', libelle: 'ecoute directe du scroll',
    motif: /addEventListener\s*\(\s*['"]scroll['"]/g, remede: 'IntersectionObserver' },

  { num: '49', gravite: 'avertissement', libelle: 'noir teinte a la place du noir',
    motif: /#(0b0b0b|111111|0a0a0a|121212)\b/gi, remede: 'une couleur sombre choisie' },

  { num: '50', gravite: 'avertissement', libelle: 'chasse fixe pour les etiquettes',
    motif: /(font-mono|font-family[^;]*monospace)/gi, remede: 'la police du projet' },

  // Plancher d accessibilite, rules/web/accessibilite.md
  { num: 'A1', gravite: 'bloquant', libelle: 'hauteur d ecran figee',
    motif: /(h-screen|height\s*:\s*100vh)/g, remede: 'min-height: 100dvh' },

  { num: 'A2', gravite: 'bloquant', libelle: 'anneau de focus supprime',
    motif: /outline\s*:\s*(none|0)/gi, remede: 'garder un focus visible' },

  { num: 'A3', gravite: 'bloquant', libelle: 'zoom desactive',
    motif: /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/gi, remede: 'ne jamais bloquer le zoom' },

  // Principe produit : aucune banque d images
  { num: 'P1', gravite: 'bloquant', libelle: 'photo de banque d images',
    motif: /(unsplash\.com|pexels\.com|pixabay\.com|shutterstock|istockphoto|stock\.adobe)/gi,
    remede: 'les photos viennent de l artisan, ou emplacement declare vide' },

  // Performance, rules/web/performance.md
  { num: 'P2', gravite: 'avertissement', libelle: 'animation sur une propriete couteuse',
    motif: /transition\s*:[^;]*\b(width|height|top|left|margin)\b/gi,
    remede: 'transform et opacity uniquement' },
];

// ---------------------------------------------------------------- contraste
const lum = (hex) => {
  const n = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// oklch approche : la clarte L est proche de la luminance perceptuelle ; on
// la convertit grossierement en luminance relative pour comparer avec le reste.
const lumOklch = (L) => {
  const y = Math.pow(Math.max(0, Math.min(1, L)), 3);
  return y;
};
const litCouleur = (v) => {
  const hx = v.match(/#([0-9a-f]{3,6})\b/i);
  if (hx) return lum(hx[1]);
  const ok = v.match(/oklch\(\s*([\d.]+)/i);
  if (ok) return lumOklch(parseFloat(ok[1]));
  return null;
};

// Paires color / background-color declarees dans un meme bloc de regle CSS.
function contrastes(texte) {
  const out = [];
  const blocs = texte.match(/\{[^{}]*\}/g) || [];
  for (const bloc of blocs) {
    const c = bloc.match(/(?:^|[;{\s])color\s*:\s*(#[0-9a-f]{3,6}\b|oklch\([^)]*\))/i);
    const f = bloc.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,6}\b|oklch\([^)]*\))/i);
    if (!c || !f) continue;
    const lc = litCouleur(c[1]), lf = litCouleur(f[1]);
    if (lc === null || lf === null) continue;
    const [x, y] = [lc, lf].sort((a, b) => b - a);
    const r = (x + 0.05) / (y + 0.05);
    if (r < 4.5) out.push({ texte: c[1], fond: f[1], ratio: r.toFixed(2) });
  }
  return out;
}

// ---------------------------------------------------------------- structure
function structure(texte, fichier) {
  const c = [];
  const imgs = texte.match(/<img\b[^>]*>/gi) || [];
  const sansAlt = imgs.filter(t => !/\balt\s*=/i.test(t));
  if (sansAlt.length) c.push({ fichier, num: 'A4', gravite: 'bloquant',
    libelle: 'image sans attribut alt', detail: sansAlt.length + ' sur ' + imgs.length,
    remede: 'alt descriptif, ou alt="" si decorative' });

  // Image d exemple : marquage obligatoire, voir rules/web/photos.md
  for (const t of imgs) {
    const marquee = /data-exemple\s*=\s*["']oui["']/i.test(t);
    const alt = (t.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    if (marquee && !/^Exemple/i.test(alt.trim())) {
      c.push({ fichier, num: 'P4', gravite: 'bloquant',
        libelle: 'image d exemple sans alt explicite',
        detail: 'alt = "' + alt.slice(0, 40) + '"',
        remede: 'l alt commence par Exemple, voir rules/web/photos.md' });
    }
  }

  const niveaux = [...texte.matchAll(/<h([1-6])\b/gi)].map(m => +m[1]);
  for (let i = 1; i < niveaux.length; i++) {
    if (niveaux[i] - niveaux[i - 1] > 1) {
      c.push({ fichier, num: 'A5', gravite: 'bloquant', libelle: 'niveau de titre saute',
        detail: 'h' + niveaux[i - 1] + ' suivi de h' + niveaux[i],
        remede: 'ne jamais sauter un niveau' });
      break;
    }
  }
  // T1 : un lien d appel compose un vrai numero, ou il n existe pas. Le
  // 2 octobre 2026, l archetype matiere livrait « tel: » vide depuis le debut.
  for (const m of texte.matchAll(/href\s*=\s*["'](tel:[^"']*)["']/gi)) {
    if (!/^tel:\+33[1-9]\d{8}$/.test(m[1])) c.push({ fichier, num: 'T1', gravite: 'bloquant',
      libelle: 'lien d appel qui ne compose rien', detail: m[1] || 'tel: vide',
      remede: 'tel:+33 suivi de neuf chiffres, ou un emplacement sans lien ; voir generateur/sections/appel.mjs' });
  }
  // T2 : une page entiere offre un moyen d appeler, ou son emplacement.
  if (/<body/i.test(texte) && !/data-appel=["'](numero|attente)["']/.test(texte)) c.push({ fichier, num: 'T2',
    gravite: 'bloquant', libelle: 'aucun moyen d appeler l entreprise', detail: 'ni numero ni emplacement',
    remede: 'rules/web/client.md : le numero est atteignable au pouce en permanence' });

  const h1 = (texte.match(/<h1\b/gi) || []).length;
  if (/<html|<body/i.test(texte) && h1 !== 1) {
    c.push({ fichier, num: 'A6', gravite: 'bloquant', libelle: 'nombre de h1 incorrect',
      detail: h1 + ' trouve', remede: 'exactement un h1 par page' });
  }
  return c;
}


// ---------------------------------------------------------------- composition
// rules/web/composition.md. Ne s applique qu a une page entiere.
const enPx = (v) => {
  const m = String(v).match(/^([\d.]+)(px|rem|em)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'px' ? n : n * 16;
};
function taillesTexte(texte) {
  const out = [];
  for (const m of texte.matchAll(/font-size\s*:\s*([^;}]+)/gi)) {
    const v = m[1].trim();
    const args = v.startsWith('clamp(') ? v.slice(6, -1).split(',') : [v];
    for (const a of args) { const px = enPx(a.trim()); if (px) out.push(px); }
  }
  return out;
}
function variables(texte) {
  const map = {};
  for (const m of texte.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{3,8})\b/gi)) map[m[1]] = m[2];
  return map;
}
function fondsDeclares(texte) {
  const vars = variables(texte);
  const out = [];
  for (const m of texte.matchAll(/background(?:-color)?\s*:\s*([^;}]+)/gi)) {
    const v = m[1].trim();
    let hex = (v.match(/#([0-9a-f]{3,6})\b/i) || [])[0];
    if (!hex) { const nv = v.match(/var\((--[\w-]+)\)/); if (nv && vars[nv[1]]) hex = vars[nv[1]]; }
    if (hex) out.push(hex.replace('#', ''));
  }
  return out;
}
const versHsl = (hex) => {
  const n = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
};
// ---------------------------------------------------------------- vie
// rules/web/mouvement.md, V1 a V6. Le mouvement se verifie sur ce qui peut
// casser : un bloc qui reste invisible, un voile qui ne part pas, un decor
// qui intercepte le doigt. Pas sur le gout.
function bloc(texte, selecteur) {
  const i = texte.indexOf(selecteur + '{');
  if (i < 0) return null;
  const j = texte.indexOf('}', i);
  return j < 0 ? null : texte.slice(i + selecteur.length + 1, j);
}
function vie(texte, fichier) {
  const c = [];
  if (!/<html|<body/i.test(texte)) return c;
  const plat = texte.replace(/\s*\n\s*/g, '');
  const dire = (num, libelle, detail) => c.push({ fichier, num, gravite: 'bloquant',
    libelle, detail, remede: 'voir rules/web/mouvement.md, ' + num });

  // V1, une animation de defilement ne touche jamais la visibilite
  for (const m of plat.matchAll(/\{([^{}]*animation-timeline[^{}]*)\}/g)) {
    const corps = m[1];
    const noms = [...corps.matchAll(/animation(?:-name)?\s*:\s*([a-z-]+)/gi)].map(x => x[1]);
    for (const nom of noms) {
      if (/^(none|linear|ease|both|forwards|infinite)$/i.test(nom)) continue;
      const kf = plat.match(new RegExp('@keyframes\\s+' + nom + '\\s*\\{[\\s\\S]{0,400}?\\}\\s*\\}'));
      if (kf && /opacity/i.test(kf[0]))
        dire('V1', 'animation de defilement sur l opacite',
          'la regle @keyframes ' + nom + ' change opacity');
    }
  }

  // V2, le mouvement se coupe
  if (/@keyframes/i.test(plat)) {
    const mq = plat.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]{0,600})/i);
    if (!mq) dire('V2', 'aucune coupure du mouvement',
      'la page anime sans @media (prefers-reduced-motion: reduce)');
    else if (!/animation\s*:\s*none/i.test(mq[1]))
      dire('V2', 'coupure du mouvement incomplete',
        'le bloc reduced-motion ne pose pas animation:none');
  }

  // V3, l ecran d entree a une sortie garantie
  if (/class="entree"/i.test(texte)) {
    const b = bloc(plat, '.entree');
    if (!b || !/pointer-events:none/i.test(b))
      dire('V3', 'voile d entree sensible au pointeur', '.entree sans pointer-events:none');
    if (!b || !/animation:/i.test(b))
      dire('V3', 'voile d entree sans sortie en CSS seul',
        '.entree ne porte pas d animation de retrait : si le script casse, le voile reste');
    const plafonds = [...plat.matchAll(/setTimeout\([^,]{1,40},\s*(\d{3,5})\s*\)/g)].map(m => +m[1]);
    if (!plafonds.some(v => v > 0 && v <= 2500))
      dire('V3', 'voile d entree sans plafond',
        'aucun setTimeout de retrait sous 2500 ms');
    const rm = plat.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]{0,600})/i);
    if (!rm || !/\.entree\{[^}]*display:none/i.test(rm[1]))
      dire('V3', 'voile d entree non neutralise en mouvement reduit',
        'le bloc reduced-motion coupe les animations sans cacher .entree');
  }

  // V4, ce qui se manipule s atteint au clavier
  for (const m of texte.matchAll(/<input[^>]*type="range"[^>]*>/gi))
    if (!/aria-label=/i.test(m[0]))
      dire('V4', 'glissiere sans intitule', m[0].slice(0, 70));
  if (/class="cadre"/i.test(texte) && !/type="range"/i.test(texte))
    dire('V4', 'comparateur sans controle natif',
      'le cadre se manipule mais aucun input type=range ne l accompagne');
  for (const m of texte.matchAll(/<div[^>]*role="(button|slider)"[^>]*>/gi))
    dire('V4', 'controle simule', m[0].slice(0, 70) + ' : utiliser <button> ou <input>');

  // V5, le decor ne bloque jamais
  for (const m of texte.matchAll(/<canvas[^>]*>/gi)) {
    if (!/aria-hidden="true"/i.test(m[0]))
      dire('V5', 'canvas non masque aux lecteurs d ecran', m[0].slice(0, 70));
    const cl = (m[0].match(/class="([^"]+)"/i) || [])[1];
    const b = cl ? bloc(plat, '.' + cl.split(' ')[0]) : null;
    if (!b || !/pointer-events:none/i.test(b))
      dire('V5', 'canvas sensible au pointeur', (cl || 'canvas') + ' sans pointer-events:none');
    // Un canvas qui remplace une photo doit garder la photo derriere lui.
    // Un canvas purement decoratif, lui, ne cache rien : il se declare avec
    // data-decor et n a rien a preserver. L exemption est etroite et ecrite.
    const decor = /data-decor="oui"/i.test(m[0]);
    const avant = texte.slice(Math.max(0, texte.indexOf(m[0]) - 1200), texte.indexOf(m[0]));
    if (!decor && !/<img\b/i.test(avant))
      dire('V5', 'canvas sans image dessous',
        'si le contexte graphique echoue, il ne reste rien a voir');
  }

  // V6, le pointeur dessine ne remplace pas le vrai
  if (/class="pointeur"/i.test(texte)) {
    const b = bloc(plat, '.pointeur');
    if (!b || !/pointer-events:none/i.test(b))
      dire('V6', 'pointeur dessine sensible au pointeur', '.pointeur sans pointer-events:none');
    // Deux fautes vues le 14 septembre 2026, chacune rend l anneau ridicule.
    if (b && /transition:[^;}]*(transform|\ball\b)/i.test(b))
      dire('V6', 'pointeur anime par une transition CSS',
        'le script ecrit transform a chaque image : la transition le fait trainer derriere la fleche');
    if (b && /(^|[;{])\s*scale:/i.test(b))
      dire('V6', 'echelle et position sur le meme element',
        '.pointeur porte scale et transform : la translation est multipliee par l echelle, l anneau part hors ecran');
    if (!/@media\(pointer:coarse\)\{[^}]*\.pointeur\{[^}]*display:none/i.test(plat)
      && !/@media\s*\(pointer:\s*coarse\)\s*\{[^}]*\.pointeur\s*\{[^}]*display:\s*none/i.test(plat))
      dire('V6', 'pointeur dessine conserve au doigt',
        'aucun @media (pointer:coarse) ne le retire');
  }
  if (/(^|[{;])\s*(\*|body|html)\s*\{[^}]*cursor:\s*none/i.test(plat))
    dire('V6', 'curseur systeme masque sur toute la page',
      'si le rendu s arrete, le visiteur ne voit plus ou il clique');

  return c;
}

function composition(texte, fichier) {
  const c = [];
  if (!/<html|<body/i.test(texte)) return c;

  // G1, methode.md : une page destinee a un artisan sort du generateur.
  // Une maquette ecrite a la main n a pas cette signature, donc elle est
  // refusee ici, quelle que soit sa qualite. C est le garde-fou, pas un avis.
  if (!/name=["']atelier-generateur["']/i.test(texte)) {
    c.push({ fichier, num: 'G1', gravite: 'bloquant',
      libelle: 'page non produite par le generateur',
      detail: 'signature atelier-generateur absente',
      remede: 'passer par generateur/composer.mjs, voir rules/methode.md' });
  }

  // G2, ne-pas-fabriquer.md : une page batie sur des photos d illustration le
  // dit, en clair, dans la page. Sans la mention, la page fait passer des
  // images generees pour les chantiers de l entreprise.
  if (/name=["']atelier-images["']\s+content=["']illustration["']/i.test(texte)
      && !/images d.{1,3}illustration/i.test(texte.replace(/<style[\s\S]*?<\/style>/gi, ''))) {
    c.push({ fichier, num: 'G2', gravite: 'bloquant',
      libelle: 'photos d illustration sans mention',
      detail: 'en-tete atelier-images=illustration, aucune mention visible dans la page',
      remede: 'voir rules/common/ne-pas-fabriquer.md' });
  }

  // C1, amplitude typographique
  const tailles = taillesTexte(texte);
  if (tailles.length >= 3) {
    const mx = Math.max(...tailles), mn = Math.min(...tailles), r = mx / mn;
    if (r < 8) c.push({ fichier, num: 'C1', gravite: 'bloquant',
      libelle: 'amplitude typographique insuffisante',
      detail: Math.round(mn) + ' px a ' + Math.round(mx) + ' px, rapport ' + r.toFixed(1) + ' contre 8 exige',
      remede: 'voir rules/web/composition.md, C1' });
  }

  // C2, amplitude lumineuse
  const fonds = fondsDeclares(texte).map(h => ({ hex: h, l: lum(h) }));
  if (fonds.length >= 2) {
    const ls = fonds.map(f => f.l);
    const ecart = Math.max(...ls) - Math.min(...ls);
    if (ecart < 0.55) c.push({ fichier, num: 'C2', gravite: 'bloquant',
      libelle: 'amplitude lumineuse insuffisante',
      detail: 'ecart de luminance ' + ecart.toFixed(2) + ' contre 0,55 exige',
      remede: 'une section pleine largeur sombre, voir composition.md, C2' });
  }

  // C3, le premier ecran affirme
  const iH1 = texte.search(/<h1\b/i);
  if (iH1 > -1) {
    const avant = texte.slice(0, iH1);
    if (/<table\b/i.test(avant)) c.push({ fichier, num: 'C3', gravite: 'bloquant',
      libelle: 'tableau avant le titre', detail: 'un <table> precede le h1',
      remede: 'les donnees viennent plus bas, voir composition.md, C3' });
    const mention = avant.match(/(proposition de site|informations proviennent|mentions l[ée]gales)/i);
    if (mention) c.push({ fichier, num: 'C3', gravite: 'bloquant',
      libelle: 'mention legale avant le titre', detail: '"' + mention[0] + '"',
      remede: 'la mention va en pied de page, voir composition.md, C3' });
    const premiere = texte.slice(iH1).match(/<\/(section|header)>/i);
    const bloc1 = premiere ? texte.slice(iH1, iH1 + premiere.index) : '';
    if (/<table\b|<dl\b/i.test(bloc1)) c.push({ fichier, num: 'C3', gravite: 'bloquant',
      libelle: 'liste de donnees sur le premier ecran',
      detail: 'un <table> ou <dl> partage la section du h1',
      remede: 'le premier ecran porte une image et une phrase' });
  }

  // 27b, palette prelevee : la famille chaude n est admise que declaree
  const declaree = /palette\s+pr[ée]lev[ée]e/i.test(texte);
  if (!declaree) {
    const vus = new Set();
    for (const m of texte.matchAll(/#([0-9a-f]{6})\b/gi)) {
      const hex = m[1].toLowerCase();
      if (vus.has(hex)) continue;
      const { h, s, l } = versHsl(hex);
      if (h >= 18 && h <= 52 && s >= 0.10 && s <= 0.50 && l >= 0.45 && l <= 0.88) {
        vus.add(hex);
        c.push({ fichier, num: '27b', gravite: 'bloquant',
          libelle: 'famille chaude non declaree',
          detail: '#' + hex + ' (teinte ' + Math.round(h) + ', saturation ' + s.toFixed(2) + ')',
          remede: 'declarer en commentaire : palette prelevee, et nommer la photo source' });
      }
    }
  }
  return c;
}

// ---------------------------------------------------------------- fichiers cites
// R-FICHIER (T49, 3 nov. 2026) : chaque image, police ou feuille citee par la
// page existe a cote d elle. Sans deuxieme paire de photos, la page pointait
// 17 fichiers avant-02-* qui n existaient pas : Chromium gardait la place de
// l image, Safari la reduisait a 28 px. Aucun controle ne le voyait.
function fichiersCites(texte, f, fichier) {
  if (extname(f) !== '.html') return [];
  const dossier = join(f, '..');
  const refs = new Set();
  for (const m of texte.matchAll(/\b(?:src|href)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of texte.matchAll(/\bsrcset="([^"]+)"/g)) for (const x of m[1].split(',')) refs.add(x.trim().split(/\s+/)[0]);
  for (const m of texte.matchAll(/url\("([^"]+)"\)/g)) refs.add(m[1]);
  const manquent = [...refs].filter(r => r && !/^([a-z]+:|#|\/\/|data:)/i.test(r))
    .map(r => r.split(/[?#]/)[0]).filter(r => /\.(avif|webp|jpe?g|png|gif|svg|ico|woff2?|css|js|html)$/i.test(r))
    .filter(r => !existsSync(join(dossier, r)));
  return manquent.length ? [{ fichier, num: 'R-FICHIER', gravite: 'bloquant', libelle: 'fichier cite par la page et absent',
    detail: manquent.length + ' : ' + manquent.slice(0, 4).join(', '), remede: 'generateur/composer.mjs, jeu()' }] : [];
}

// ---------------------------------------------------------------- parcours
function fichiers(chemin) {
  const s = statSync(chemin);
  if (s.isFile()) return EXT.has(extname(chemin)) ? [chemin] : [];
  return readdirSync(chemin).flatMap(n =>
    EXCLUS.includes(n) || n.startsWith('.') ? [] : fichiers(join(chemin, n)));
}

const cible = process.argv[2];
if (!cible) { console.error('usage: node verifier-site.mjs <chemin> [--json]'); process.exit(2); }

const constats = [];
for (const f of fichiers(cible)) {
  const texte = readFileSync(f, 'utf8');
  const octets = statSync(f).size;
  const court = basename(f);

  texte.split('\n').forEach((ligne, i) => {
    if (ligne.includes('verif-ignore')) return;
    for (const r of REGLES) {
      r.motif.lastIndex = 0;
      let m;
      while ((m = r.motif.exec(ligne)) !== null) {
        constats.push({ fichier: court, ligne: i + 1, num: r.num, gravite: r.gravite,
          libelle: r.libelle, extrait: m[0].trim().slice(0, 60), remede: r.remede });
      }
    }
  });

  constats.push(...structure(texte, court));
  constats.push(...fichiersCites(texte, f, court));
  constats.push(...composition(texte, court));
  constats.push(...vie(texte, court));

  for (const p of contrastes(texte)) {
    constats.push({ fichier: court, num: 'A7', gravite: 'bloquant',
      libelle: 'contraste sous 4,5:1',
      detail: p.texte + ' sur ' + p.fond + ' = ' + p.ratio + ':1',
      remede: 'plancher WCAG 2.2 AA, non negociable' });
  }

  const budget = extname(f) === '.css' ? BUDGETS.css : BUDGETS.page;
  if (octets > budget) {
    constats.push({ fichier: court, num: 'P3', gravite: 'avertissement',
      libelle: 'budget de poids depasse',
      detail: Math.round(octets / 1024) + ' Ko contre ' + Math.round(budget / 1024) + ' Ko',
      remede: 'voir rules/web/performance.md' });
  }
}

// ---------------------------------------------------------------- mentions legales
// ML, tache T50 (docs/specs/S-MENTIONS.md) : un site d abonne (balise
// atelier-regime = abonne) porte une page mentions-legales.html avec chaque
// mention obligatoire, un lien vers elle sur chaque page (MP1), et le mediateur
// pres du contact de l accueil (MP3). Un site de prospection n en a pas besoin.
const MENTIONS_EXIGEES = ['ML1', 'ML4', 'ML5', 'ML6', 'ML8', 'ML9', 'ML10', 'ML11', 'ML12'];
function mentionsLegales(chemin) {
  const c = [];
  if (!statSync(chemin).isDirectory()) return c;
  const pages = readdirSync(chemin).filter(n => n.endsWith('.html'));
  const lire = (n) => readFileSync(join(chemin, n), 'utf8');
  const abonne = pages.some(n => /<meta name="atelier-regime" content="abonne">/.test(lire(n)));
  if (!abonne) return c;
  const ml = (detail, fichier = 'mentions-legales.html') => c.push({ fichier, num: 'ML', gravite: 'bloquant',
    libelle: 'mentions legales d un site d abonne', detail, remede: 'docs/specs/S-MENTIONS.md, generateur/sections/mentions.mjs' });
  if (!pages.includes('mentions-legales.html')) ml('page mentions-legales.html absente');
  else {
    const t = lire('mentions-legales.html');
    const manquent = MENTIONS_EXIGEES.filter(m => !t.includes(`data-ml="${m}"`));
    if (manquent.length) ml('mention(s) absente(s) : ' + manquent.join(', '));
  }
  for (const n of pages) if (!/href="mentions-legales\.html"/.test(lire(n))) ml('aucun lien vers les mentions legales', n);
  if (pages.includes('index.html') && !lire('index.html').includes('data-ml="ML10"'))
    ml('mediateur de la consommation absent de l accueil (R. 616-1)', 'index.html');
  return c;
}
constats.push(...mentionsLegales(cible));

// ---------------------------------------------------------------- referencement
// R-REGIME, R-OG, R-JSONLD, tache T51 (docs/specs/S-REFERENCEMENT.md). Ne
// regarde que les pages qui disent leur regime (balise atelier-regime).
function referencementSite(chemin) {
  const c = [];
  const dossier = statSync(chemin).isDirectory() ? chemin : join(chemin, '..');
  const pages = statSync(chemin).isDirectory() ? readdirSync(chemin).filter(n => n.endsWith('.html')) : [basename(chemin)];
  const lire = (n) => readFileSync(join(dossier, n), 'utf8');
  const meta = (t, nom) => (t.match(new RegExp(`<meta (?:name|property)="${nom}" content="([^"]*)"`)) || [])[1];
  const dire = (num, gravite, fichier, detail, remede) => c.push({ fichier, num, gravite,
    libelle: { 'R-REGIME': 'regime de referencement', 'R-OG': 'apercu de partage (Open Graph)', 'R-JSONLD': 'donnees structurees',
      'R-SITE': 'robots.txt et plan du site', 'R-ADRESSE': 'adresse publique', 'R-TITRE': 'titre ou description trop longs',
      'R-EXEMPLE': 'photos de l artisan dites « exemple », ou exemples non dits',
      'R-AVIS': 'emplacement d avis vide sur un site d abonne',
      'R-FORM': 'aucun formulaire', 'R-MESURE': 'mesure d audience' }[num],
    detail, remede: remede || 'docs/specs/S-REFERENCEMENT.md' });
  let regimeVu = null, adresseVue = null;
  for (const n of pages) {
    const t = lire(n);
    const regime = meta(t, 'atelier-regime');
    if (!regime) continue;
    regimeVu = regime;
    const adresse = meta(t, 'atelier-adresse');
    if (adresse && adresse !== 'aucune') adresseVue = adresse;
    const noindex = /<meta name="robots" content="[^"]*noindex/i.test(t);
    if (regime === 'abonne' && noindex) dire('R-REGIME', 'bloquant', n, 'site d abonne en noindex : invisible sur Google');
    if (regime === 'prospection' && !noindex) dire('R-REGIME', 'bloquant', n, 'site de prospection sans noindex : un artisan qui n a rien demande serait expose');
    for (const p of ['og:title', 'og:description', 'og:image'])
      if (!meta(t, p)) dire('R-OG', 'bloquant', n, p + ' absent');
    if (adresse && adresse !== 'aucune' && !meta(t, 'og:url')) dire('R-OG', 'bloquant', n, 'og:url absent alors que l adresse est connue');
    const img = meta(t, 'og:image');
    if (img) {
      const local = adresse && img.startsWith(adresse) ? img.slice(adresse.length) : img;
      if (/^https?:/.test(local) || !existsSync(join(dossier, local))) dire('R-OG', 'bloquant', n, 'og:image ne pointe aucun fichier du site : ' + img);
    }
    if (regime === 'abonne' && meta(t, 'atelier-images') === 'illustration') dire('R-OG', 'bloquant', n, 'image d exemple sur un site d abonne');
    // R-EXEMPLE, tache T54 (constat S-022) : sur un site d abonne, les photos
    // sont les chantiers de l artisan ; rien ne les dit « exemple », et le site
    // ne se dit pas « proposition ». Sur un site de prospection a photos
    // d illustration, chaque image le dit.
    const corps = t.replace(/<head>[\s\S]*?<\/head>/, '');
    // R-AVIS, tache T56 (constat S-024) : un site d abonne montre des avis reels
    // ou aucune section d avis, jamais un emplacement vide.
    if (regime === 'abonne' && /Les avis viennent ici|class="carte vide"|À compléter/.test(corps))
      dire('R-AVIS', 'bloquant', n, 'emplacement d avis vide (« Les avis viennent ici »)', 'generateur/sections/avis.mjs');
    // R-FORM : aucun formulaire sur un site (decision de Fabrice du 6 nov.
    // 2026, Q10 : le client appelle, rien ne reste dans une base que personne
    // ne lit), et jamais une cle secrete Supabase dans une page.
    if (/<form\b/i.test(corps)) dire('R-FORM', 'bloquant', n, 'formulaire dans la page : les sites n en ont plus (Q10, 6 nov.)', 'generateur/composer.mjs');
    if (/sb_secret_[A-Za-z0-9_-]{6,}/.test(t)) dire('R-FORM', 'bloquant', n, 'cle secrete Supabase dans la page', 'generateur/composer.mjs');
    // R-MESURE, tache T22 : aucun script tiers, sauf la mesure Umami d'un site
    // d'abonne ; quand elle est la, chaque lien d'appel est compte et les
    // mentions legales disent ce qui est mesure (ML12).
    const externes = [...t.matchAll(/<script\b[^>]*\bsrc="(?:https?:)?\/\/[^"]*"[^>]*>/g)].map(m => m[0]);
    for (const sc of externes) {
      const umami = /data-website-id="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/.test(sc);
      if (!umami) dire('R-MESURE', 'bloquant', n, 'script tiers : ' + sc.slice(0, 120), 'generateur/sections/mesure.mjs');
      else if (regime !== 'abonne') dire('R-MESURE', 'bloquant', n, 'mesure d audience sur un site de prospection', 'generateur/sections/mesure.mjs');
    }
    if (externes.length) {
      const nonComptes = (t.match(/<a\b[^>]*data-appel="numero"[^>]*>/g) || []).filter(a => !/data-umami-event="Appeler"/.test(a)).length;
      if (nonComptes) dire('R-MESURE', 'bloquant', n, `${nonComptes} lien(s) d appel non compte(s)`, 'generateur/sections/mesure.mjs, marquerAppels');
      if (pages.includes('mentions-legales.html')) {
        const ml12 = (lire('mentions-legales.html').match(/data-ml="ML12">([^<]*)</) || [])[1] || '';
        if (!/Umami/.test(ml12) || /aucun traceur/.test(ml12)) dire('R-MESURE', 'bloquant', 'mentions-legales.html', 'la mesure d audience n est pas dite (ML12)', 'generateur/sections/mesure.mjs, mention');
      }
    }
    if (regime === 'abonne') {
      const m = corps.match(/data-exemple="oui"|alt="Exemple|Proposition de site|Photographies d’exemple|class="marqueur">Exemple/i);
      if (m) dire('R-EXEMPLE', 'bloquant', n, 'site d abonne : « ' + m[0] + ' »', 'generateur/composer.mjs, PHOTOS_EXEMPLE');
    } else if (meta(t, 'atelier-images') === 'illustration') {
      const nues = (corps.match(/<img\b[^>]*>/gi) || []).filter(x => !/data-exemple="oui"/.test(x)).length;
      if (nues) dire('R-EXEMPLE', 'bloquant', n, nues + ' image(s) d illustration non marquee(s) « exemple »', 'rules/web/photos.md');
    }
    const blocs = [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    if (regime === 'prospection' && blocs.length) dire('R-JSONLD', 'bloquant', n, 'donnees structurees sur un site de prospection');
    if (regime === 'abonne' && n === 'index.html') {
      if (blocs.length !== 1) dire('R-JSONLD', 'bloquant', n, blocs.length + ' bloc(s) JSON-LD, 1 attendu');
      else {
        let d = null;
        try { d = JSON.parse(blocs[0]); } catch (e) { dire('R-JSONLD', 'bloquant', n, 'JSON-LD illisible : ' + e.message); }
        if (d) {
          const a = d.address || {};
          if (!d['@type'] || !d.name) dire('R-JSONLD', 'bloquant', n, '@type ou name absent');
          if (!a.streetAddress || !a.postalCode || !a.addressLocality) dire('R-JSONLD', 'bloquant', n, 'address incomplete (rue, code postal, commune)');
          if (/"(aggregateRating|review)"/.test(blocs[0])) dire('R-JSONLD', 'bloquant', n, 'note ou avis sur soi-meme : jamais');
          const decode = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
          if (d.name && !decode((t.match(/<title>([^<]*)<\/title>/) || [])[1] || '').includes(d.name))
            dire('R-JSONLD', 'bloquant', n, 'name absent du titre de la page : ' + d.name);
          if (d.telephone && !t.includes(`href="tel:${d.telephone}"`)) dire('R-JSONLD', 'bloquant', n, 'telephone absent de la page (invente ?) : ' + d.telephone);
        }
      }
    }
    const titre = (t.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (titre.length > 70) dire('R-TITRE', 'avertissement', n, `titre de ${titre.length} caracteres (60 conseilles)`);
    const desc = meta(t, 'description') || '';
    if (desc.length > 170) dire('R-TITRE', 'avertissement', n, `description de ${desc.length} caracteres (160 conseilles)`);
  }
  if (!statSync(chemin).isDirectory() || !regimeVu) return c;
  const robots = existsSync(join(dossier, 'robots.txt')) ? readFileSync(join(dossier, 'robots.txt'), 'utf8') : null;
  if (regimeVu === 'abonne') {
    if (!robots || !/^Allow:\s*\/\s*$/m.test(robots) || /^Disallow:\s*\/\s*$/m.test(robots)) dire('R-SITE', 'bloquant', 'robots.txt', 'site d abonne : robots.txt absent ou qui interdit');
    if (!adresseVue) dire('R-ADRESSE', 'avertissement', 'index.html', 'site d abonne sans adresse publique : ni URL canonique ni plan du site ; a refabriquer quand l adresse existe');
    else {
      const plan = existsSync(join(dossier, 'sitemap.xml')) ? readFileSync(join(dossier, 'sitemap.xml'), 'utf8') : '';
      if (!plan) dire('R-SITE', 'bloquant', 'sitemap.xml', 'plan du site absent');
      for (const n of pages) {
        const loc = adresseVue + (n === 'index.html' ? '' : n.replace(/\.html$/, ''));
        if (plan && !plan.includes(`<loc>${loc}</loc>`)) dire('R-SITE', 'bloquant', 'sitemap.xml', 'page absente du plan : ' + loc);
      }
      if (robots && !robots.includes(`Sitemap: ${adresseVue}sitemap.xml`)) dire('R-SITE', 'bloquant', 'robots.txt', 'ligne Sitemap absente');
    }
  } else if (robots && /^Allow:\s*\/\s*$/m.test(robots)) dire('R-SITE', 'bloquant', 'robots.txt', 'site de prospection : robots.txt qui autorise');
  return c;
}
constats.push(...referencementSite(cible));

// ---------------------------------------------------------------- textes alternatifs
// R-ALT, tache T55 (constat S-023) : chaque texte alternatif d image d un site
// fabrique vient du fichier de son metier (`alt` de generateur/metiers/<cle>.json).
// Un site de couverture decrivait « l echafaudage monte sur une facade ».
function altDuMetier(chemin) {
  const c = [];
  if (!statSync(chemin).isDirectory() || !existsSync(join(chemin, 'donnees.json'))) return c;
  let metier;
  try { metier = JSON.parse(readFileSync(join(chemin, 'donnees.json'), 'utf8')).metier; } catch { return c; }
  const fm = join(import.meta.dirname, '..', 'generateur', 'metiers', `${metier}.json`);
  if (!metier || !existsSync(fm)) return c;
  const permis = new Set(Object.values(JSON.parse(readFileSync(fm, 'utf8')).alt || {}).map(x => String(x).toLowerCase()));
  const decode = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const n of readdirSync(chemin).filter(f => f.endsWith('.html'))) {
    const etrangers = new Set();
    for (const m of readFileSync(join(chemin, n), 'utf8').matchAll(/<img\b[^>]*\balt="([^"]*)"/gi)) {
      const a = decode(m[1]).replace(/^Exemple, /, '').trim().toLowerCase();
      if (a && !permis.has(a)) etrangers.add(a);
    }
    if (etrangers.size) c.push({ fichier: n, num: 'R-ALT', gravite: 'bloquant', libelle: 'texte alternatif qui ne vient pas du fichier du metier',
      detail: `${metier} : « ${[...etrangers].slice(0, 2).join(' » ; « ')} »`, remede: `generateur/metiers/${metier}.json, champ alt` });
  }
  return c;
}
constats.push(...altDuMetier(cible));

// ---------------------------------------------------------------- sortie
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ constats }, null, 2));
} else if (constats.length === 0) {
  console.log('Aucun constat. La page respecte le plancher verifiable.');
} else {
  const groupes = {};
  for (const c of constats) (groupes[c.num] ??= []).push(c);
  const ordre = Object.entries(groupes).sort((a, b) =>
    (a[1][0].gravite === 'bloquant' ? 0 : 1) - (b[1][0].gravite === 'bloquant' ? 0 : 1));
  for (const [num, liste] of ordre) {
    const p = liste[0];
    console.log('\n[' + p.gravite.toUpperCase() + '] ' + num + ' ' + p.libelle + ' (' + liste.length + ')');
    console.log('  remede: ' + p.remede);
    for (const c of liste.slice(0, 5)) {
      const ou = c.ligne ? c.fichier + ':' + c.ligne : c.fichier;
      console.log('  ' + ou + '  ' + (c.extrait ? '"' + c.extrait + '"' : c.detail));
    }
    if (liste.length > 5) console.log('  ... et ' + (liste.length - 5) + ' autres');
  }
  const bloquants = constats.filter(c => c.gravite === 'bloquant').length;
  console.log('\n' + bloquants + ' bloquant(s), ' + (constats.length - bloquants) + ' avertissement(s).');
  console.log('Le plancher se verifie. La forme reste libre : test d unicite dans design-interdits.md.');
}

process.exit(constats.some(c => c.gravite === 'bloquant') ? 1 : 0);
