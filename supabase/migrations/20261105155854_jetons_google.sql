-- T24 : les jetons Google, chiffrés par le service AVANT d'arriver ici
-- (`supabase/functions/_shared/chiffre.mjs`, AES-256-GCM), rangés dans
-- `prive.jetons_google` (migration 20261005014022_app, X7 du TRD).
--
-- Le schéma `prive` n'est pas servi par l'API : le service (fonction Edge
-- `google-retour`, import de la nuit `atelier/avis.mjs`) passe par ces trois
-- fonctions, appelables par la clé de service seule. Le texte échangé est le
-- chiffré en base64 : rien ici ne voit un jeton en clair.
create or replace function public.poser_jeton_google(p_siren text, p_jeton text, p_portee text)
returns void language sql security definer set search_path = '' as $$
  insert into prive.jetons_google (siren, jeton_chiffre, portee, mis_a_jour_le)
  values (p_siren, decode(p_jeton, 'base64'), p_portee, now())
  on conflict (siren) do update
    set jeton_chiffre = excluded.jeton_chiffre, portee = excluded.portee, mis_a_jour_le = now();
$$;

create or replace function public.lire_jeton_google(p_siren text)
returns table (jeton text, portee text) language sql security definer set search_path = '' as $$
  select encode(j.jeton_chiffre, 'base64'), j.portee from prive.jetons_google j where j.siren = p_siren;
$$;

create or replace function public.oublier_jeton_google(p_siren text)
returns void language sql security definer set search_path = '' as $$
  delete from prive.jetons_google where siren = p_siren;
$$;

revoke all on function public.poser_jeton_google(text, text, text) from public, anon, authenticated;
revoke all on function public.lire_jeton_google(text) from public, anon, authenticated;
revoke all on function public.oublier_jeton_google(text) from public, anon, authenticated;
grant execute on function public.poser_jeton_google(text, text, text) to service_role;
grant execute on function public.lire_jeton_google(text) to service_role;
grant execute on function public.oublier_jeton_google(text) to service_role;
