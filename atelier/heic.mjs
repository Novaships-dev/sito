// Convertir une photo HEIC (iPhone) sans décoder nous-mêmes le HEVC.
//
// Pourquoi : le HEIC est compressé en HEVC, couvert par des brevets dont la
// licence vise aussi le décodage logiciel sur serveur (Access Advance,
// novembre 2025) ; aucune exemption publiée. Plutôt que d'embarquer un
// décodeur, on demande la conversion aux « transformations d'images » de
// Supabase, qui acceptent le HEIC en entrée (offre Pro ; documentation
// Supabase du 2 octobre 2026 : 25 Mo et 2 500 px au plus, 100 images
// d'origine incluses puis 5 $ les 1 000).
//
// Dans la plupart des cas, ce chemin ne sert même pas : Safari sur iPhone sait
// afficher le HEIC, et l'app le convertit en JPEG avant l'envoi. Il reste pour
// un HEIC envoyé depuis Android, Windows ou un ordinateur sans Safari.
//
// NON ESSAYÉ contre Supabase au 5 octobre 2026 : le projet est en offre
// gratuite, sans transformations. À essayer dès le passage en Pro, avec une
// vraie photo d'iPhone (PLAN-APP.md, section 5.4).

const LARGEUR_MAX = 2500; // plafond des transformations Supabase

// `chemin` : chemin de l'original dans l'espace photos-chantiers.
export function convertisseurSupabase({ url, cleService, espace = 'photos-chantiers' }) {
  if (!url || !cleService) throw new Error('convertisseur HEIC : SUPABASE_URL et la clé de service sont nécessaires');
  return async function convertirHeic(_buffer, { chemin } = {}) {
    if (!chemin) throw new Error('convertisseur HEIC : chemin de l original manquant');
    const cible = `${url}/storage/v1/render/image/authenticated/${espace}/${chemin.split('/').map(encodeURIComponent).join('/')}`
      + `?width=${LARGEUR_MAX}&height=${LARGEUR_MAX}&resize=contain&quality=95`;
    const r = await fetch(cible, { headers: { Authorization: `Bearer ${cleService}`, Accept: 'image/jpeg,image/png,image/webp' } });
    if (!r.ok) throw new Error(`conversion HEIC refusée par Supabase : ${r.status} ${await r.text().catch(() => '')}`.slice(0, 300));
    return Buffer.from(await r.arrayBuffer());
  };
}
