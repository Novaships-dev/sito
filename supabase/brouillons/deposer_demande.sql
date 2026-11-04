-- Le formulaire de demande d'un site d'abonné écrit dans la base (T10,
-- exigence S21, question Q3).
--
-- Q3 (29 oct. 2026) recommandait un Worker Cloudflare devant la base. Depuis
-- T45, un site d'abonné est servi par Cloudflare Pages, sans Worker : le
-- formulaire appelle donc directement cette fonction par l'API de Supabase
-- (`/rest/v1/rpc/deposer_demande`), avec la clé publique déjà publiée dans
-- l'app. Aucune clé secrète dans une page, aucun serveur, 0 €. Choix réversible
-- (Q3) : si la demande part ailleurs plus tard, le formulaire change d'adresse,
-- pas de champs.
--
-- La fonction refait tous les contrôles, dans la base :
--   - champ piège rempli (un robot) : répond « recue » sans rien écrire ;
--   - site inconnu ou pas d'abonné : « inconnu » ;
--   - message vide ou trop long, ni téléphone ni courriel, champ trop long :
--     « invalide » ;
--   - plus de 10 demandes par jour (de Paris) depuis une même adresse IP, ou
--     plus de 50 pour un même site : « trop ».
-- L'adresse IP n'est jamais gardée en clair : seulement son empreinte SHA-256
-- avec le jour, effacée au bout de deux jours.
-- Une demande reçue compte aussi dans `statistiques.demandes` du jour de Paris.

create table prive.compteurs_demandes (
  cle  text not null,
  jour date not null,
  n    integer not null default 0 check (n >= 0),
  primary key (cle, jour)
);
alter table prive.compteurs_demandes enable row level security;
revoke all on prive.compteurs_demandes from public, anon, authenticated;

create function public.deposer_demande(
  p_siren text, p_message text,
  p_nom text default null, p_telephone text default null, p_courriel text default null,
  p_page text default '/', p_piege text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jour date := prive.jour_paris(now());
  v_entetes json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text;
  v_cle text;
  v_n integer;
  v_nom text := nullif(btrim(coalesce(p_nom, '')), '');
  v_tel text := nullif(btrim(coalesce(p_telephone, '')), '');
  v_courriel text := nullif(btrim(coalesce(p_courriel, '')), '');
  v_message text := btrim(coalesce(p_message, ''));
  v_page text := coalesce(nullif(btrim(coalesce(p_page, '')), ''), '/');
begin
  -- Un robot remplit tout, y compris le champ caché : on ne lui dit rien.
  if coalesce(p_piege, '') <> '' then return 'recue'; end if;

  if not exists (select 1 from public.sites s
                  where s.siren = p_siren and s.statut in ('abonne', 'publie')) then
    return 'inconnu';
  end if;

  if char_length(v_message) < 1 or char_length(v_message) > 4000
     or (v_tel is null and v_courriel is null)
     or char_length(coalesce(v_nom, '')) > 120 or char_length(coalesce(v_tel, '')) > 30
     or char_length(coalesce(v_courriel, '')) > 200 or char_length(v_page) > 300 then
    return 'invalide';
  end if;

  -- L'adresse du visiteur : celle que Cloudflare a vue, sinon la première de
  -- x-forwarded-for.
  v_ip := coalesce(nullif(v_entetes ->> 'cf-connecting-ip', ''),
                   nullif(btrim(split_part(coalesce(v_entetes ->> 'x-forwarded-for', ''), ',', 1)), ''),
                   'inconnue');
  v_cle := encode(sha256(convert_to(v_ip || '|' || v_jour::text, 'utf8')), 'hex');

  delete from prive.compteurs_demandes where jour < v_jour - 1;
  insert into prive.compteurs_demandes as c (cle, jour, n) values (v_cle, v_jour, 1)
    on conflict (cle, jour) do update set n = c.n + 1
    returning c.n into v_n;
  if v_n > 10 then return 'trop'; end if;

  select count(*) into v_n from public.demandes d
   where d.siren = p_siren and prive.jour_paris(d.recue_le) = v_jour;
  if v_n >= 50 then return 'trop'; end if;

  insert into public.demandes (siren, nom, telephone, courriel, message, page, recue_le)
  values (p_siren, v_nom, v_tel, v_courriel, v_message, v_page, now());

  insert into public.statistiques as st (siren, jour, page, source, visites, appels, demandes)
  values (p_siren, v_jour, '/', 'tout', 0, 0, 1)
  on conflict (siren, jour, page, source) do update set demandes = st.demandes + 1;

  return 'recue';
end $$;

revoke all on function public.deposer_demande(text, text, text, text, text, text, text) from public;
grant execute on function public.deposer_demande(text, text, text, text, text, text, text) to anon, authenticated, service_role;
