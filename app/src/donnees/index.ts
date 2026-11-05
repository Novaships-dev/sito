// Quelle source de données : Supabase si l'adresse et la clé publique sont
// fournies (app/.env.local, jamais dans le dépôt), sinon la démonstration.
// ?demo dans l'adresse force la démonstration.
import type { Donnees } from '../types';
import { donneesDemo } from './demo';
import { donneesSupabase } from './supabase';

export function choisirDonnees(): Donnees {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const cle = import.meta.env.VITE_SUPABASE_CLE_PUBLIQUE as string | undefined;
  const demoDemandee = new URLSearchParams(location.search).has('demo');
  if (demoDemandee || !url || !cle) return donneesDemo();
  return donneesSupabase(url, cle);
}
