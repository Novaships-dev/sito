// Assemblage des textes : rien sur l entreprise n est ecrit ici. Seule la
// connaissance du metier est puisee dans metiers/<metier>.json, et la variante
// est tiree de la graine. Les faits de l entreprise viennent de Sirene.
//
// `interdits` contient toutes les phrases deja prises par les voisins (meme
// metier, meme commune). Aucune n est reprise tant qu il en reste une libre :
// deux artisans voisins ne doivent pas lire la meme phrase sur leur site.
// Le vivier a ete triple le 1er octobre 2026 pour que cette regle tienne.
export function composerTextes(base, g, param, interdits = []) {
  const deja = new Set(interdits);
  const libres = (liste) => { const l = liste.filter(x => !deja.has(x)); return l.length ? l : liste; };
  const prendre = (liste) => g.choisir(libres(liste));
  const prendreN = (liste, n) => {
    const l = [...libres(liste)], out = [];
    while (out.length < n && l.length) out.push(l.splice(Math.floor(g.suivant() * l.length), 1)[0]);
    while (out.length < n) out.push(g.choisir(liste));
    return out;
  };
  const gestes = [...base.gestes];
  // rotation deterministe puis selection
  const depart = g.entier(0, gestes.length - 1);
  const choisis = [];
  for (let i = 0; i < param.nbGestes; i++) choisis.push(gestes[(depart + i) % gestes.length]);
  const r = base.rubriques;
  return {
    titre: prendre(base.titres),
    chapo: prendre(base.chapos),
    gestes: choisis.map(x => ({ terme: x.terme, texte: prendre(x.textes) })),
    avant: prendre(base.coupure.avant),
    apres: prendre(base.coupure.apres),
    invitation: prendre(base.legendes.invitation),
    matiere: base.matiere ? prendre(base.matiere) : '',
    precision: prendre(base.legendes.precision),
    legendes: prendreN(base.legendes.comparateurs, 2),
    rub: {
      gestes: prendre(r.gestes),
      chantier: prendre(r.chantier),
      verifiable: prendre(r.verifiable),
      contact: prendre(r.contact),
      prix: r.prix ? prendre(r.prix) : 'Ce que ça coûte, à peu près.',
    },
  };
}

// Toutes les phrases d un site, pour le registre : c est ce que les voisins
// suivants n auront pas le droit de reprendre.
export function phrases(t) {
  return [t.titre, t.chapo, t.avant, t.apres, t.invitation, t.matiere, t.precision,
    ...t.legendes, ...t.gestes.map(x => x.texte), ...Object.values(t.rub)].filter(Boolean);
}
