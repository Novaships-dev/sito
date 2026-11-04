// Retirer la position GPS d'une vidéo avant l'envoi, sans la réencoder
// (tâche T46). Repéré pendant T44 : l'iPhone et Android écrivent l'endroit
// du tournage dans le fichier.
//
// Où elle se trouve (format ISO BMFF, MP4 et MOV) :
//   - `moov/udta/©xyz` : la position en texte ISO 6709 (Android) ;
//   - `moov/udta/loci` : la boîte de position du 3GPP (ffmpeg en MP4, certains Android) ;
//   - `moov/meta` au format QuickTime : la table `keys` donne des noms,
//     `ilst` des valeurs numérotées ; la clé
//     `com.apple.quicktime.location.ISO6709` (et ses voisines
//     `com.apple.quicktime.location.*`) porte la position (iPhone).
//
// Méthode : chaque boîte visée devient une boîte `free` de même taille, son
// contenu mis à zéro. Rien ne bouge dans le fichier : les décalages vers les
// images (`stco`, `co64`) restent justes, la vidéo se lit pareil.

const CONTENEURS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'meta', 'ilst', 'edts', 'dinf']);
const enTexte = (o: Uint8Array, i: number) => String.fromCharCode(o[i], o[i + 1], o[i + 2], o[i + 3]);

type Boite = { type: string; debut: number; tete: number; fin: number };

function boites(o: Uint8Array, v: DataView, debut: number, fin: number): Boite[] {
  const out: Boite[] = [];
  let i = debut;
  while (i + 8 <= fin) {
    let taille = v.getUint32(i);
    let tete = 8;
    if (taille === 1) {
      if (i + 16 > fin) break;
      taille = Number(v.getBigUint64(i + 8));
      tete = 16;
    } else if (taille === 0) taille = fin - i;
    if (taille < tete || i + taille > fin) break;
    out.push({ type: enTexte(o, i + 4), debut: i, tete, fin: i + taille });
    i += taille;
  }
  return out;
}

// `meta` : en MP4 il commence par 4 octets de version ; en QuickTime, non.
function enfantsDeMeta(o: Uint8Array, v: DataView, b: Boite): Boite[] {
  const sans = boites(o, v, b.debut + b.tete, b.fin);
  const avec = boites(o, v, b.debut + b.tete + 4, b.fin);
  const valides = (l: Boite[]) => l.length > 0 && l[l.length - 1].fin === b.fin && l.every((x) => /^[\x20-\x7e©]{4}$/.test(x.type));
  return valides(sans) ? sans : valides(avec) ? avec : [];
}

function effacer(o: Uint8Array, b: Boite) {
  o.set([0x66, 0x72, 0x65, 0x65], b.debut + 4); // « free »
  o.fill(0, b.debut + b.tete, b.fin);
}

// Rend le nombre de boîtes effacées ; `octets` est modifié sur place.
export function retirerPosition(octets: Uint8Array): number {
  const v = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  let effacees = 0;
  const parcourir = (liste: Boite[]) => {
    for (const b of liste) {
      if (b.type === '\u00a9xyz' || b.type === 'loci') { effacer(octets, b); effacees++; continue; }
      if (b.type === 'meta') {
        const enfants = enfantsDeMeta(octets, v, b);
        const keys = enfants.find((x) => x.type === 'keys');
        const ilst = enfants.find((x) => x.type === 'ilst');
        if (keys && ilst) {
          // keys : version (4) + nombre (4), puis [taille (4) + espace (4) + nom]
          const visees = new Set<number>();
          let i = keys.debut + keys.tete + 8, n = 1;
          while (i + 8 <= keys.fin) {
            const t = v.getUint32(i);
            if (t < 8 || i + t > keys.fin) break;
            let nom = '';
            for (let k = i + 8; k < i + t; k++) nom += String.fromCharCode(octets[k]);
            if (nom.startsWith('com.apple.quicktime.location')) visees.add(n);
            i += t; n++;
          }
          for (const item of boites(octets, v, ilst.debut + ilst.tete, ilst.fin)) {
            if (visees.has(v.getUint32(item.debut + 4))) { effacer(octets, item); effacees++; }
          }
        }
        parcourir(enfants.filter((x) => x.type !== 'keys' && x.type !== 'ilst'));
        continue;
      }
      if (CONTENEURS.has(b.type)) parcourir(boites(octets, v, b.debut + b.tete, b.fin));
    }
  };
  parcourir(boites(octets, v, 0, octets.length));
  return effacees;
}
