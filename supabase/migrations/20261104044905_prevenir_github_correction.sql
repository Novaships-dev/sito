-- Correction de 20261104044828_prevenir_github (T45), appliquée une minute
-- après elle.
--
-- Panne : PL/pgSQL lit tous les champs nommés d'une condition, même quand le
-- début de la condition est faux. `new.etat` (colonne des seules photos)
-- faisait échouer toute écriture dans `profils` et `tarifs` : « record "new"
-- has no field "etat" ». L'essai `supabase/essais/prevenir.sql` l'a montré au
-- premier passage. Les lignes passent désormais par jsonb, et NEW et OLD ne
-- sont lus que quand ils existent (DELETE, INSERT).

create or replace function prive.prevenir_github()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_siren text;
  v_jeton text;
  v_nouveau jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_ancien jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
begin
  v_siren := coalesce(v_nouveau ->> 'siren', v_ancien ->> 'siren');
  if tg_table_name = 'photos' then
    if v_nouveau ->> 'etat' is distinct from 'prete' then return null; end if;
    if v_ancien ->> 'etat' = 'prete' and (v_ancien ->> 'chemin') is not distinct from (v_nouveau ->> 'chemin') then return null; end if;
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
