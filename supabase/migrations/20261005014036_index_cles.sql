-- Index des clés étrangères ajoutées par la migration app (conseiller
-- Supabase « unindexed foreign keys », 5 octobre 2026).
create index avis_valide_par on public.avis (valide_par);
create index versions_site_fabrication on public.versions_site (fabrication_id);
create index videos_chantier on public.videos (chantier_id);
