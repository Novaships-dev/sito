-- Prévenir GitHub quand le site d'un abonné doit être refait (tâche T45).
--
-- Décision de Fabrice du 29 oct. 2026 : pas de serveur loué ; « les photos
-- sont préparées dans l'app, le site est refait et publié par GitHub Actions,
-- gratuitement ». La base appelle l'API de GitHub (`repository_dispatch`,
-- type « refaire-site », avec le SIREN) ; le workflow
-- `.github/workflows/refaire-site.yml` refait, vérifie et publie.
--
-- Quand : une photo devient prête ; le profil ou les tarifs changent.
-- Le jeton GitHub est un secret du coffre de Supabase (`github_dispatch`),
-- posé par Fabrice (action F21) ; sans lui, rien n'est appelé. L'appel passe
-- par pg_net : asynchrone, il ne ralentit ni ne fait échouer l'écriture de
-- l'artisan. Plusieurs appels rapprochés ne font que deux tours (le workflow
-- n'en garde qu'un en attente par site).

create extension if not exists pg_net with schema extensions;

create or replace function prive.prevenir_github()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_siren text := coalesce(new.siren, old.siren);
  v_jeton text;
begin
  -- Une photo ne compte qu'au moment où elle devient prête.
  if tg_table_name = 'photos' and (new.etat is distinct from 'prete'
      or (tg_op = 'UPDATE' and old.etat = 'prete' and old.chemin is not distinct from new.chemin)) then
    return null;
  end if;
  select decrypted_secret into v_jeton from vault.decrypted_secrets where name = 'github_dispatch' limit 1;
  if v_jeton is null or v_siren is null then return null; end if;
  perform net.http_post(
    url := 'https://api.github.com/repos/Novaships-dev/sito/dispatches',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_jeton, 'Accept', 'application/vnd.github+json',
      'User-Agent', 'sito-base', 'X-GitHub-Api-Version', '2022-11-28'),
    body := jsonb_build_object('event_type', 'refaire-site', 'client_payload', jsonb_build_object('siren', v_siren)));
  return null;
end $$;
revoke all on function prive.prevenir_github() from public, anon, authenticated;

create trigger profils_prevenir_github after insert or update on public.profils
  for each row execute function prive.prevenir_github();
create trigger tarifs_prevenir_github after insert or update or delete on public.tarifs
  for each row execute function prive.prevenir_github();
create trigger photos_prevenir_github after insert or update on public.photos
  for each row execute function prive.prevenir_github();
