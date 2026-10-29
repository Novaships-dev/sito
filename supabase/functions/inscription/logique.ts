// Ce que fait la fonction Edge « inscription », sans rien savoir de Supabase :
// les accès à la base et aux comptes arrivent par `Depot` (index.ts pour le
// vrai, scripts/essai-inscription.mjs pour l'essai). Décision de Fabrice du
// 29 octobre 2026 : inscription par e-mail et mot de passe, une seule fois,
// sans code ; le lien envoyé par SMS rattache le compte à son entreprise.
//
// Une seule adresse, en POST, corps JSON :
//   { action: 'lire', jeton }                          ce que le lien ouvre
//   { action: 'inscrire', jeton, courriel, motDePasse } crée le compte
//   { action: 'reprendre', jeton, motDePasse }          nouveau mot de passe
// Réponse : { ok: true, ... } ou { ok: false, erreur } avec une phrase pour
// l'artisan. Jamais le SIREN, jamais un autre compte.

export type Invitation = {
  siren: string; genre: 'inscription' | 'reprise'; user_id: string | null;
  expire_le: string; utilisee_le: string | null; nom_affiche: string;
};

export interface Depot {
  lire(jeton: string): Promise<Invitation | null>;
  // Réserve le lien d'un coup (un seul gagnant si deux envois se croisent).
  reserver(jeton: string): Promise<boolean>;
  liberer(jeton: string): Promise<void>;
  creerCompte(courriel: string, motDePasse: string): Promise<{ id: string } | { existe: true }>;
  changerMotDePasse(userId: string, motDePasse: string): Promise<{ courriel: string }>;
  courrielDe(userId: string): Promise<string | null>;
  rattacher(userId: string, siren: string, jeton: string): Promise<void>;
}

export type Reponse = { statut: number; corps: Record<string, unknown> };

export const MOT_DE_PASSE_MIN = 8;
const COURRIEL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const JETON = /^[0-9a-f]{64}$/;

const non = (statut: number, erreur: string): Reponse => ({ statut, corps: { ok: false, erreur } });
const LIEN_MORT = 'Ce lien n’est pas valable. Demandez-en un nouveau à Sitô.';

async function valable(depot: Depot, jeton: unknown): Promise<Invitation | Reponse> {
  if (typeof jeton !== 'string' || !JETON.test(jeton)) return non(404, LIEN_MORT);
  const inv = await depot.lire(jeton);
  if (!inv) return non(404, LIEN_MORT);
  if (inv.utilisee_le) return non(410, 'Ce lien a déjà servi. Connectez-vous avec votre adresse e-mail et votre mot de passe.');
  if (Date.parse(inv.expire_le) < Date.now()) return non(410, 'Ce lien a expiré. Demandez-en un nouveau à Sitô.');
  return inv;
}

function motDePasseRefuse(m: unknown): string | null {
  if (typeof m !== 'string' || m.length < MOT_DE_PASSE_MIN) return `Le mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (m.length > 72) return 'Le mot de passe doit faire au plus 72 caractères.';
  return null;
}

export async function traiter(corps: unknown, depot: Depot): Promise<Reponse> {
  const c = (corps && typeof corps === 'object' ? corps : {}) as Record<string, unknown>;
  const inv = await valable(depot, c.jeton);
  if ('statut' in inv) return inv;
  const jeton = c.jeton as string;

  if (c.action === 'lire') {
    const corpsLu: Record<string, unknown> = { ok: true, genre: inv.genre, entreprise: inv.nom_affiche };
    if (inv.genre === 'reprise' && inv.user_id) corpsLu.courriel = await depot.courrielDe(inv.user_id);
    return { statut: 200, corps: corpsLu };
  }

  const refus = motDePasseRefuse(c.motDePasse);
  if (refus) return non(400, refus);
  const motDePasse = c.motDePasse as string;

  if (c.action === 'inscrire') {
    if (inv.genre !== 'inscription') return non(400, LIEN_MORT);
    const courriel = typeof c.courriel === 'string' ? c.courriel.trim().toLowerCase() : '';
    if (!COURRIEL.test(courriel) || courriel.length > 200) return non(400, 'Adresse e-mail invalide.');
    if (!(await depot.reserver(jeton))) return non(410, 'Ce lien a déjà servi. Connectez-vous avec votre adresse e-mail et votre mot de passe.');
    try {
      const compte = await depot.creerCompte(courriel, motDePasse);
      if ('existe' in compte) {
        await depot.liberer(jeton);
        return non(409, 'Cette adresse a déjà un compte Sitô. Connectez-vous, ou choisissez une autre adresse.');
      }
      await depot.rattacher(compte.id, inv.siren, jeton);
      return { statut: 200, corps: { ok: true, courriel } };
    } catch (e) {
      await depot.liberer(jeton);
      throw e;
    }
  }

  if (c.action === 'reprendre') {
    if (inv.genre !== 'reprise' || !inv.user_id) return non(400, LIEN_MORT);
    if (!(await depot.reserver(jeton))) return non(410, 'Ce lien a déjà servi. Demandez-en un nouveau à Sitô.');
    try {
      const { courriel } = await depot.changerMotDePasse(inv.user_id, motDePasse);
      return { statut: 200, corps: { ok: true, courriel } };
    } catch (e) {
      await depot.liberer(jeton);
      throw e;
    }
  }

  return non(400, 'Demande inconnue.');
}
