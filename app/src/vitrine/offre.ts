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

// Ce qui suit le prix. Vide tant que Fabrice n'a pas dit s'il facture la TVA
// (question posée le 5 nov.) : « HT » s'il la facture, sinon la mention de la
// franchise en base.
export const MENTION_TVA = '';

// Numéro WhatsApp de MonSiteArtisan, au format international sans « + » ni espace
// (33612345678). Vide : les boutons mènent à la section « Contact », qui le dit.
export const WHATSAPP = '';

export const MESSAGE_MAQUETTE = 'Bonjour, je suis artisan et je voudrais la maquette gratuite de mon site.';

export function lienWhatsApp(message = MESSAGE_MAQUETTE): string {
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}` : '#contact';
}

export const euros = (n: number) => `${n.toLocaleString('fr-FR')} €`;
