-- L'espace de prospection de Fabrice (T70).
--
-- Décision du 27 nov. 2026 : « j'aimerais avoir une interface spéciale qui
-- affiche les numero du jour a apeller avec nom d'entreprise et détails de
-- l'entreprise les point fort et point faible de l'entreprise sur le web ou
-- réseaux […] que je puisse cocher si je les contacter si je doit le rapeller si
-- l'offre et refuser ». Sur les numéros : « Oui aucun numero stocker juste ceux
-- du jour a appeler ». Statuts : « Oui nickel pour l'instant ». Ajout à la main :
-- « Oui parfait ».
--
-- La table public.prospects existe déjà (campagnes d'envoi, schéma du 2 oct.,
-- sans droit hors service) : les fiches d'appel ont leur propre table.
--
-- Trois tables :
--   prospecteurs : les comptes qui ont droit à l'espace (Fabrice). Remplie par
--                  Fabrice ou par la clé de service, jamais par l'app.
--   fiches_prospection : un artisan à appeler, son diagnostic web, son statut, le jour
--                  où il figure dans la liste. `telephone` n'est gardé que pour
--                  ce jour-là : prive.purger_numeros_prospection() l'efface
--                  pour toute fiche qui n'est pas à appeler aujourd'hui ou plus
--                  tard (lancée chaque nuit, et par la soirée de prospection).
--   appels_prospection : l'historique, une ligne par résultat d'appel.
-- Droits : un prospecteur lit et écrit tout ; tout autre compte, et le visiteur
-- anonyme, ne voit rien. Un artisan abonné ne voit jamais ces tables.

create table public.prospecteurs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now()
);
alter table public.prospecteurs enable row level security;
revoke all on public.prospecteurs from public, anon, authenticated;
grant select on public.prospecteurs to authenticated;
create policy prospecteurs_soi on public.prospecteurs for select to authenticated
  using (user_id = (select auth.uid()));

create function prive.est_prospecteur()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.prospecteurs p where p.user_id = auth.uid()) $$;
revoke all on function prive.est_prospecteur() from public, anon;
grant execute on function prive.est_prospecteur() to authenticated;

create table public.fiches_prospection (
  id             uuid primary key default gen_random_uuid(),
  siren          text check (siren is null or siren ~ '^[0-9]{9}$'),
  nom            text not null check (length(nom) between 1 and 160),
  metier         text not null default 'Autre' check (length(metier) <= 60),
  commune        text check (length(commune) <= 80),
  telephone      text check (telephone is null or telephone ~ '^\+?[0-9 .]{10,20}$'),
  statut         text not null default 'a-appeler' check (statut in (
                   'a-appeler', 'pas-de-reponse', 'a-rappeler', 'interesse', 'maquette-envoyee',
                   'essai-lance', 'abonne', 'refuse', 'ne-plus-appeler')),
  a_appeler_le   date,
  rappel_heure   text check (rappel_heure is null or rappel_heure ~ '^[0-2][0-9]:[0-5][0-9]$'),
  points_forts   jsonb not null default '[]' check (jsonb_typeof(points_forts) = 'array'),
  points_faibles jsonb not null default '[]' check (jsonb_typeof(points_faibles) = 'array'),
  angle          text check (length(angle) <= 400),
  lien_maquette  text check (lien_maquette is null or lien_maquette ~ '^https://'),
  note_google    numeric(2,1) check (note_google is null or note_google between 0 and 5),
  avis_google    integer check (avis_google is null or avis_google >= 0),
  site_actuel    text check (length(site_actuel) <= 200),
  notes          text check (length(notes) <= 4000),
  raison_refus   text check (length(raison_refus) <= 300),
  source         text not null default 'manuel' check (source in ('soiree', 'manuel')),
  cree_le        timestamptz not null default now(),
  maj_le         timestamptz not null default now(),
  -- un « ne plus appeler » ou un refus ne revient jamais dans la liste du jour
  constraint fiches_prospection_hors_liste check (statut not in ('refuse', 'ne-plus-appeler', 'abonne', 'essai-lance') or a_appeler_le is null),
  constraint fiches_prospection_rappel_date check (statut <> 'a-rappeler' or a_appeler_le is not null)
);
create unique index fiches_prospection_siren_unique on public.fiches_prospection (siren) where siren is not null;
create index fiches_prospection_jour on public.fiches_prospection (a_appeler_le) where a_appeler_le is not null;
alter table public.fiches_prospection enable row level security;
revoke all on public.fiches_prospection from public, anon, authenticated;
grant select, insert, update on public.fiches_prospection to authenticated;
create policy fiches_prospection_lire on public.fiches_prospection for select to authenticated using ((select prive.est_prospecteur()));
create policy fiches_prospection_ajouter on public.fiches_prospection for insert to authenticated with check ((select prive.est_prospecteur()));
create policy fiches_prospection_modifier on public.fiches_prospection for update to authenticated
  using ((select prive.est_prospecteur())) with check ((select prive.est_prospecteur()));

create table public.appels_prospection (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.fiches_prospection (id) on delete cascade,
  statut      text not null check (statut in (
                'a-appeler', 'pas-de-reponse', 'a-rappeler', 'interesse', 'maquette-envoyee',
                'essai-lance', 'abonne', 'refuse', 'ne-plus-appeler')),
  note        text check (length(note) <= 2000),
  fait_le     timestamptz not null default now(),
  auteur      uuid default auth.uid() references auth.users (id) on delete set null
);
create index appels_prospection_prospect on public.appels_prospection (prospect_id);
create index appels_prospection_fait on public.appels_prospection (fait_le);
alter table public.appels_prospection enable row level security;
revoke all on public.appels_prospection from public, anon, authenticated;
grant select, insert on public.appels_prospection to authenticated;
create policy appels_prospection_lire on public.appels_prospection for select to authenticated using ((select prive.est_prospecteur()));
create policy appels_prospection_ajouter on public.appels_prospection for insert to authenticated with check ((select prive.est_prospecteur()));

-- maj_le suit chaque modification
create function prive.fiches_prospection_maj() returns trigger language plpgsql set search_path = '' as $$
begin new.maj_le := now(); return new; end $$;
create trigger fiches_prospection_maj before update on public.fiches_prospection for each row execute function prive.fiches_prospection_maj();

-- Les numéros ne vivent que le jour de l'appel.
create function prive.purger_numeros_prospection()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_n integer;
begin
  update public.fiches_prospection
     set telephone = null
   where telephone is not null
     and (a_appeler_le is null or a_appeler_le < prive.jour_paris(now()));
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke all on function prive.purger_numeros_prospection() from public, anon, authenticated;
grant execute on function prive.purger_numeros_prospection() to service_role;

-- Chaque nuit à 3 h 05 de Paris en hiver (2 h 05 UTC), les numéros qui ne sont
-- plus du jour partent. pg_cron est gratuit, inclus dans Supabase.
create extension if not exists pg_cron;
select cron.schedule('purger-numeros-prospection', '5 2 * * *', $$select prive.purger_numeros_prospection()$$);
