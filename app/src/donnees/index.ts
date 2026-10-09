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

// Mode Play Store (application Android, TWA) : aucune vente ni aucun prix dans
// l'app (règle de facturation de Google Play). Le site Sitô s'en charge.
// L'application Android ouvre l'app avec ?source=android ; on s'en souvient.
export function modeAndroid(): boolean {
  try {
    if (new URLSearchParams(location.search).get('source') === 'android') localStorage.setItem('sito-android', '1');
    return localStorage.getItem('sito-android') === '1' || document.referrer.startsWith('android-app://');
  } catch {
    return document.referrer.startsWith('android-app://');
  }
}
