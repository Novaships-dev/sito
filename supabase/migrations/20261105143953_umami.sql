-- T22 : statistiques des sites d'abonnés (app/specs/07-TACHES.md, TRD §7 :
-- « Umami (hébergé) | visites, clics « Appeler » | CNIL : un site par
-- artisan »). Chaque site d'abonné a son site Umami ; le service range ici son
-- identifiant, le générateur le pose dans les pages (script et événement
-- « Appeler »), l'import de la nuit le lit pour remplir `statistiques`.
--
-- Droits : aucun changement. `sites` reste écrit par le service seul ; un
-- membre lit la ligne de son site (politique `sites_lire`), identifiant
-- compris : il n'a rien de secret, il est dans le code de la page publique.
alter table public.sites
  add column if not exists umami_id text
    check (umami_id is null or umami_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

comment on column public.sites.umami_id is
  'Identifiant du site Umami (T22) ; posé par le service, lu par le générateur et l''import des statistiques.';
