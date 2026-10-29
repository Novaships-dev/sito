-- Inscription par lien, e-mail et mot de passe, une seule fois, sans code.
--
-- Décision de Fabrice du 29 octobre 2026 : connexion, « le mec s'inscrit
-- c'est fini » ; « Ben ouais » à l'inscription par e-mail et mot de passe,
-- une seule fois, sans code. Fabrice envoie à l'artisan, par SMS, un lien qui
-- porte un jeton : le jeton dit à quelle entreprise le compte se rattache.
--
-- Le compte est créé par la fonction Edge `inscription`
-- (supabase/functions/inscription), avec la clé de service qu'elle reçoit de
-- Supabase : les inscriptions libres restent fermées, et aucun e-mail de
-- confirmation n'est envoyé (le serveur d'e-mail fourni par Supabase n'écrit
-- qu'aux membres de l'équipe du projet).
--
-- Deux genres de lien :
--   inscription : crée le compte et le rattache à l'entreprise ;
--   reprise     : choisit un nouveau mot de passe pour un compte qui existe
--                 (« mot de passe oublié » : Fabrice renvoie un lien).
-- Un lien sert une fois et vaut 14 jours.

create table public.invitations (
  jeton       text primary key check (jeton ~ '^[0-9a-f]{64}$'),
  siren       text not null references public.entreprises (siren) on delete cascade,
  genre       text not null default 'inscription' check (genre in ('inscription', 'reprise')),
  user_id     uuid references auth.users (id) on delete cascade,
  cree_le     timestamptz not null default now(),
  expire_le   timestamptz not null default now() + interval '14 days',
  utilisee_le timestamptz,
  check (genre = 'inscription' or user_id is not null)
);
create index invitations_siren on public.invitations (siren);
create index invitations_user on public.invitations (user_id);

-- Service seulement : ni l'app ni un visiteur ne lisent un jeton.
alter table public.invitations enable row level security;
revoke all on public.invitations from anon, authenticated;

-- Fabriquer un lien. Pour une reprise, le compte est celui du titulaire de
-- l'entreprise. Jeton : 256 bits tirés par la base (deux uuid v4).
create function public.creer_invitation(p_siren text, p_genre text default 'inscription')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_jeton text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if p_genre = 'reprise' then
    select m.user_id into v_user from public.membres m
     where m.siren = p_siren order by (m.role = 'titulaire') desc, m.cree_le limit 1;
    if v_user is null then raise exception 'aucun compte pour l''entreprise %', p_siren; end if;
  end if;
  insert into public.invitations (jeton, siren, genre, user_id) values (v_jeton, p_siren, p_genre, v_user);
  return v_jeton;
end $$;

revoke all on function public.creer_invitation(text, text) from public, anon, authenticated;
grant execute on function public.creer_invitation(text, text) to service_role;
