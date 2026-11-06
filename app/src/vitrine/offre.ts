// L'offre de MonSiteArtisan, en un seul endroit (décisions de Fabrice du 5 nov. 2026,
// memoire/decisions.md). La page de MonSiteArtisan et, plus tard, les liens de paiement
// lisent ces valeurs : un prix ne s'écrit nulle part ailleurs.
export const OFFRE = {
  prixMois: 80,            // site complet, par mois, engagement 12 mois
  engagementMois: 12,      // lié au nom de domaine payé à l'année
  prixAn: 720,             // site complet, payé à l'année, renouvelé chaque année
  moisOfferts: 1,          // au mois seulement, pas à l'année
  moisOffertsVitrine: 3,   // les trois premiers artisans, dont le site sert de modèle
  placesVitrine: 3,
};

// La TVA. Fabrice a demandé de trancher (6 nov. 2026) : sa micro-entreprise
// est sous le seuil de la franchise en base (37 500 € de chiffre d'affaires
// de services), donc pas de TVA, et la mention obligatoire est celle-ci. À
// changer pour « HT » le jour où il dépasse le seuil ou choisit la TVA.
export const MENTION_TVA = 'TVA non applicable, art. 293 B du CGI';

// Numéro WhatsApp de MonSiteArtisan, au format international sans « + » ni espace
// (33612345678). Vide : les boutons mènent à la section « Contact », qui le dit.
export const WHATSAPP = '';

export const MESSAGE_MAQUETTE = 'Bonjour, je suis artisan et je voudrais la maquette gratuite de mon site.';

export function lienWhatsApp(message = MESSAGE_MAQUETTE): string {
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}` : '#contact';
}

export const euros = (n: number) => `${n.toLocaleString('fr-FR')}\u00a0€`;

// Les photos de la page (docs/vitrine-images.md), dans app/public/vitrine/.
// Livrées par Fabrice le 6 nov. 2026 (ChatGPT), réduites en WebP sans
// métadonnées. null tant qu'un fichier n'est pas livré : son cadre garde un fond sobre et
// le navigateur ne demande rien (pas d'image cassée). Le jour où la photo
// arrive, on met son chemin ici ('vitrine/1.webp').
export const PHOTOS: Record<'facadier' | 'telephone' | 'avant' | 'apres' | 'couvreur' | 'peintre', string | null> = {
  facadier: 'vitrine/1.webp',
  telephone: 'vitrine/2.webp',
  avant: 'vitrine/3.webp',
  apres: 'vitrine/4.webp',
  couvreur: 'vitrine/5.webp',
  peintre: 'vitrine/6.webp',
};
