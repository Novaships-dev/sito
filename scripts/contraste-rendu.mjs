// Contraste mesure sur la page rendue, pas dans le code.
//
// Le 2 octobre 2026, deux des trois sites de demonstration avaient un bloc
// entier illisible : noir sur noir sur un sol clair, blanc sur blanc parce
// qu une couleur de la famille « luxe froid » etait ecrite avec une opacite
// nulle (#19202600). Le controle A7 de verifier-site lit les couleurs ecrites
// en dur ; les deux pannes passaient par des variables. Seul le navigateur
// sait quelle couleur est vraiment derriere un texte.
//
// La fonction `mesurer` est envoyee telle quelle dans la page par
// page.evaluate : elle ne doit rien utiliser de l exterieur.

export function mesurer(limite = 12) {
  const toile = document.createElement('canvas');
  toile.width = toile.height = 1;
  const cx = toile.getContext('2d', { willReadFrequently: true });
  // Le navigateur convertit lui-meme oklch, color-mix et le reste en sRGB.
  const rgba = (c) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = 'rgba(0,0,0,0)';
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };
  const poser = (haut, bas) => ({
    r: haut.r * haut.a + bas.r * (1 - haut.a),
    g: haut.g * haut.a + bas.g * (1 - haut.a),
    b: haut.b * haut.a + bas.b * (1 - haut.a), a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  // Un calque decoratif (la poussiere de l ecran d ambiance) n est pas une
  // photo : le texte pose dessus se juge sur le fond reel, pas sur le pire cas.
  const medias = [...document.querySelectorAll('img, canvas, video, picture')]
    .filter(m => !m.closest('[data-decor], [aria-hidden="true"]'))
    .map(m => ({ m, r: m.getBoundingClientRect() })).filter(x => x.r.width > 20 && x.r.height > 20);
  const surUneImage = (el, r) => medias.some(x => !el.contains(x.m)
    && x.r.left < r.right && x.r.right > r.left && x.r.top < r.bottom && x.r.bottom > r.top);

  const nom = (el) => {
    const c = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const p = el.parentElement;
    const cp = p && typeof p.className === 'string' && p.className.trim() ? '.' + p.className.trim().split(/\s+/)[0] : '';
    return (cp ? cp + ' > ' : '') + el.tagName.toLowerCase() + c;
  };

  const fautes = [];
  let mesures = 0, ignores = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|svg|SVG|CANVAS|IMG|OPTION)$/.test(el.tagName)) continue;
    const texte = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!texte) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility !== 'visible') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.left < -1000) continue;
    // Un texte decoupe dans une photo (background-clip:text) n a pas de
    // couleur propre : il se juge a l oeil, pas ici.
    const remplissage = st.webkitTextFillColor;
    if (remplissage && rgba(remplissage).a === 0) continue;
    let opacite = 1;
    for (let p = el; p; p = p.parentElement) opacite *= parseFloat(getComputedStyle(p).opacity);
    if (opacite < 0.2) continue;

    // Les couches de fond, de l element vers la racine, jusqu a la premiere
    // opaque. Une image de fond rend le fond inconnu.
    const couches = [];
    let inconnu = false, opaque = false;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const sp = getComputedStyle(p);
      if (sp.backgroundImage && sp.backgroundImage !== 'none') { inconnu = true; break; }
      const c = rgba(sp.backgroundColor);
      if (c.a > 0) couches.push(c);
      if (c.a >= 0.999) { opaque = true; break; }
    }
    if (inconnu) { ignores++; continue; }
    if (!opaque) {
      const racine = rgba(getComputedStyle(document.documentElement).backgroundColor);
      couches.push(racine.a > 0 ? { ...racine, a: 1 } : { r: 255, g: 255, b: 255, a: 1 });
    }
    // Pose sur une photo : on ne sait pas ce qu il y a dessous. Avec un voile
    // propre d au moins moitie, on juge le pire cas, sur noir comme sur blanc ;
    // sans voile, le texte se juge a l oeil, pas ici.
    let fonds;
    if (surUneImage(el, r)) {
      const propres = [];
      for (let p = el; p; p = p.parentElement) {
        if (p !== el && p.querySelector('img, video, canvas:not([data-decor])')) break;
        const c = rgba(getComputedStyle(p).backgroundColor);
        if (c.a > 0) propres.push(c);
      }
      const voile = 1 - propres.reduce((a, c) => a * (1 - c.a), 1);
      if (voile < 0.5) { ignores++; continue; }
      fonds = [{ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }].map(base =>
        propres.slice().reverse().reduce((acc, c) => poser(c, acc), base));
    } else {
      const bas = couches[couches.length - 1];
      fonds = [couches.slice(0, -1).reverse().reduce((acc, c) => poser(c, acc), { ...bas, a: 1 })];
    }
    const t = rgba(st.color);
    const taille = parseFloat(st.fontSize);
    const gras = parseInt(st.fontWeight, 10) >= 700;
    const seuil = (taille >= 24 || (taille >= 18.66 && gras)) ? 3 : 4.5;
    mesures++;
    const pire = Math.min(...fonds.map(f => ratio(poser({ ...t, a: t.a * Math.min(1, opacite) }, f), f)));
    if (pire < seuil) {
      fautes.push({ ou: nom(el), texte: texte.slice(0, 32), ratio: +pire.toFixed(2), seuil,
        couleur: hex(poser(t, fonds[0])), fond: hex(fonds[0]) });
    }
  }
  fautes.sort((a, b) => a.ratio - b.ratio);
  return { mesures, ignores, total: fautes.length, fautes: fautes.slice(0, limite) };
}
