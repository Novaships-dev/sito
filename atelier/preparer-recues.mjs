// Préparer les photos que l'app a envoyées : `photos.etat = recue` devient
// `prete` avec son image propre, ou `illisible` avec un motif écrit pour
// l'artisan.
//
// app/specs/05-SCHEMA-BACKEND.md §7 (« Préparer les photos reçues ») :
//   lit  : le stockage (le fichier tel que l'appareil l'a produit) ;
//   écrit: photos.chemin, largeur, hauteur, etat, motif, format_origine.
//
// `octets` et `octets_source` ne sont PAS touchés : ce sont les tailles des
// fichiers que l'app a envoyés, et elles restent vraies après la préparation.
// `format_origine` l'est, en revanche : l'app le devine du navigateur, qui se
// trompe (piège du 21 octobre, un .DNG annoncé « image/DNG » sous Windows) ;
// ici il est lu dans les premiers octets du fichier.
//
// Ce qui est pris comme source : `chemin_source` quand l'original en pleine
// résolution est arrivé (décision du 9 octobre : il suit la version réduite),
// sinon `chemin_original`. Si l'original annoncé manque dans le stockage, on
// retombe sur la version réduite plutôt que de perdre la photo.
//
// **Reprenable** : l'image propre s'écrit avant la ligne. Une panne entre les
// deux laisse la photo « reçue », et le passage suivant réécrit la même image
// au même chemin (`remplacer: true`) puis la ligne. Rien n'est jamais déclaré
// « prête » sans que son image soit dans le stockage.
//
// Le HEIC n'est pas décodé ici (brevets HEVC, `atelier/heic.mjs`) : sans
// convertisseur, la photo reste « reçue » avec un motif d'attente, et le
// passage suivant la reprendra quand le convertisseur existera.
import { preparerPhoto, Illisible } from './photos.mjs';

export const ESPACE = 'photos-chantiers';
const MOTIF_MAX = 280; // contrainte de la colonne

// L'image propre se range à côté de l'original : <clé>-propre.jpg
export function cheminPropre(cheminOriginal) {
  const sansExtension = cheminOriginal.replace(/\.[^./]*$/, '');
  return `${sansExtension.replace(/-original$/, '')}-propre.jpg`;
}

const nomDe = (chemin) => chemin.split('/').pop();
const borne = (texte) => (texte.length > MOTIF_MAX ? `${texte.slice(0, MOTIF_MAX - 1)}…` : texte);

// Rend un bilan chiffré : rien n'est « réussi » qui ne soit compté ici.
export async function preparerRecues({ sb, espace = ESPACE, convertirHeic = null, limite = 50, dire = () => {} } = {}) {
  if (!sb) throw new Error('preparerRecues : il faut l adaptateur Supabase (atelier/supabase.mjs)');
  const stockage = sb.stockage(espace);

  const lignes = await sb.lire('photos', {
    select: 'id,siren,chantier_id,chemin_original,chemin_source,format_origine,etat',
    filtres: { etat: ['eq', 'recue'] },
    ordre: 'cree_le',
    limite,
  });

  const bilan = { prises: lignes.length, pretes: 0, illisibles: 0, attente: 0, sansFichier: 0, refusees: 0, pannes: [] };

  for (const l of lignes) {
    const sources = [l.chemin_source, l.chemin_original].filter(Boolean);
    if (!sources.length) {
      bilan.sansFichier++;
      bilan.pannes.push({ id: l.id, quoi: 'aucun fichier : ni chemin_source ni chemin_original' });
      dire(`photo ${l.id} : aucun fichier à lire`);
      continue;
    }

    // Lire la meilleure source disponible. Un 404 n'est pas une panne : le
    // fichier n'est pas encore arrivé. Tout autre refus en est une.
    let octets = null, luDepuis = null, refus = null;
    for (const source of sources) {
      try { octets = await stockage.lire(source); luDepuis = source; break; }
      catch (e) {
        if (e.statut !== 404) { refus = `lecture de ${source} : ${e.message}`; break; }
        dire(`photo ${l.id} : ${source} absent du stockage`);
      }
    }
    if (!octets) {
      // La photo reste « reçue » : elle sera reprise au passage suivant.
      // Jamais « illisible » — ce n'est pas la faute de la photo.
      bilan.pannes.push({ id: l.id, quoi: refus || `fichier absent du stockage : ${sources.join(', ')}` });
      if (refus) bilan.refusees++; else bilan.sansFichier++;
      continue;
    }

    const nom = nomDe(l.chemin_original || luDepuis);
    let resultat;
    try {
      resultat = await preparerPhoto(octets, { nom, chemin: luDepuis, convertirHeic });
    } catch (e) {
      if (!(e instanceof Illisible)) { bilan.pannes.push({ id: l.id, quoi: `préparation : ${e.message}` }); continue; }
      await sb.majorer('photos', { id: ['eq', l.id] }, { etat: 'illisible', motif: borne(e.motif) });
      bilan.illisibles++;
      dire(`photo ${l.id} : illisible — ${e.motif}`);
      continue;
    }

    // Une vidéo rangée avec les photos : on le dit, on ne la transforme pas.
    if (resultat.video) {
      const motif = borne(`« ${nom} » : c'est une vidéo, pas une photo`);
      await sb.majorer('photos', { id: ['eq', l.id] }, { etat: 'illisible', motif });
      bilan.illisibles++;
      continue;
    }

    // HEIC sans convertisseur : reste « reçue », avec le motif d'attente.
    if (resultat.attente) {
      await sb.majorer('photos', { id: ['eq', l.id] }, { motif: borne(resultat.motif) });
      bilan.attente++;
      dire(`photo ${l.id} : ${resultat.motif}`);
      continue;
    }

    const chemin = cheminPropre(l.chemin_original || luDepuis);
    try {
      await stockage.ecrire(chemin, resultat.image, { type: 'image/jpeg', remplacer: true });
    } catch (e) {
      bilan.pannes.push({ id: l.id, quoi: `écriture de ${chemin} : ${e.message}` });
      continue;
    }

    const ecrites = await sb.majorer('photos', { id: ['eq', l.id] }, {
      chemin,
      largeur: resultat.largeur,
      hauteur: resultat.hauteur,
      format_origine: String(resultat.format).slice(0, 24),
      etat: 'prete',
      motif: null,
    });
    if (ecrites.length !== 1) {
      bilan.pannes.push({ id: l.id, quoi: `l image est écrite mais la ligne non : ${ecrites.length} ligne(s) touchée(s)` });
      continue;
    }
    bilan.pretes++;
    dire(`photo ${l.id} : prête, ${resultat.largeur}×${resultat.hauteur}, ${resultat.image.length} octets`);
  }

  return bilan;
}
