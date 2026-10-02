-- Sitô : qui peut lire et écrire quoi.
--
-- Principe : la sécurité au niveau des lignes est active sur TOUTES les
-- tables. Un artisan connecté ne voit que les entreprises dont il est membre.
-- Ce qu'il dit de lui (profil, tarifs, chantiers, photos) lui appartient ; ce
-- qui vient d'une source (Sirene, Google, la mesure d'audience, le générateur)
-- est en lecture seule pour lui et s'écrit par le service. Le suivi de
-- prospection n'est visible que du service. Les visiteurs anonymes n'ont accès
-- à rien.

create or replace function prive.est_membre(p_siren text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.membres m
    where m.siren = p_siren and m.user_id = (select auth.uid())
  );
$$;
revoke all on function prive.est_membre(text) from public, anon;
grant execute on function prive.est_membre(text) to authenticated;

alter table public.metiers      enable row level security;
alter table public.entreprises  enable row level security;
alter table public.membres      enable row level security;
alter table public.profils      enable row level security;
alter table public.tarifs       enable row level security;
alter table public.sites        enable row level security;
alter table public.fabrications enable row level security;
alter table public.chantiers    enable row level security;
alter table public.photos       enable row level security;
alter table public.avis         enable row level security;
alter table public.statistiques enable row level security;
alter table public.prospects    enable row level security;

-- Référence : lisible par tout artisan connecté.
create policy metiers_lire on public.metiers for select to authenticated using (true);

-- Faits publics et données produites par une source : lecture seule.
create policy entreprises_lire on public.entreprises for select to authenticated
  using ((select prive.est_membre(siren)));
create policy membres_lire on public.membres for select to authenticated
  using (user_id = (select auth.uid()));
create policy sites_lire on public.sites for select to authenticated
  using ((select prive.est_membre(siren)));
create policy fabrications_lire on public.fabrications for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and (select prive.est_membre(s.siren))));
create policy avis_lire on public.avis for select to authenticated
  using ((select prive.est_membre(siren)));
create policy statistiques_lire on public.statistiques for select to authenticated
  using ((select prive.est_membre(siren)));

-- Ce que dit l'artisan : lecture et écriture, sur ses entreprises seulement.
create policy profils_lire on public.profils for select to authenticated
  using ((select prive.est_membre(siren)));
create policy profils_creer on public.profils for insert to authenticated
  with check ((select prive.est_membre(siren)));
create policy profils_modifier on public.profils for update to authenticated
  using ((select prive.est_membre(siren))) with check ((select prive.est_membre(siren)));

create policy tarifs_lire on public.tarifs for select to authenticated
  using ((select prive.est_membre(siren)));
create policy tarifs_creer on public.tarifs for insert to authenticated
  with check ((select prive.est_membre(siren)));
create policy tarifs_modifier on public.tarifs for update to authenticated
  using ((select prive.est_membre(siren))) with check ((select prive.est_membre(siren)));
create policy tarifs_supprimer on public.tarifs for delete to authenticated
  using ((select prive.est_membre(siren)));

create policy chantiers_lire on public.chantiers for select to authenticated
  using ((select prive.est_membre(siren)));
create policy chantiers_creer on public.chantiers for insert to authenticated
  with check ((select prive.est_membre(siren)));
create policy chantiers_modifier on public.chantiers for update to authenticated
  using ((select prive.est_membre(siren))) with check ((select prive.est_membre(siren)));
create policy chantiers_supprimer on public.chantiers for delete to authenticated
  using ((select prive.est_membre(siren)));

-- Une photo envoyée par l'artisan est toujours une photo de l'entreprise :
-- il ne peut pas en déclarer une « illustration », ni la rattacher au
-- chantier d'une autre entreprise.
create policy photos_lire on public.photos for select to authenticated
  using ((select prive.est_membre(siren)));
create policy photos_creer on public.photos for insert to authenticated
  with check ((select prive.est_membre(siren)) and origine = 'entreprise'
    and (chantier_id is null or exists (select 1 from public.chantiers c where c.id = chantier_id and c.siren = photos.siren)));
create policy photos_modifier on public.photos for update to authenticated
  using ((select prive.est_membre(siren)))
  with check ((select prive.est_membre(siren)) and origine = 'entreprise'
    and (chantier_id is null or exists (select 1 from public.chantiers c where c.id = chantier_id and c.siren = photos.siren)));
create policy photos_supprimer on public.photos for delete to authenticated
  using ((select prive.est_membre(siren)));

-- prospects : aucune politique, donc aucun accès hors service.

-- Les visiteurs anonymes n'ont rien à faire dans ces tables.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
