-- L'original en pleine résolution suit la photo réduite.
--
-- Décision de Fabrice, 9 octobre 2026 (« 3. OK ») : après la version réduite
-- préparée sur l'appareil (JPEG sans métadonnées, 3 200 px), l'app envoie
-- aussi le fichier d'origine (HEIC, JPEG…). Plan : app/PLAN-APP.md, 5.3.
--
-- chemin_original : ce que l'app a envoyé en premier (la version réduite,
--   ou le fichier brut s'il n'a pas pu être préparé sur l'appareil).
-- chemin_source   : le fichier d'origine, arrivé après ; vide tant qu'il n'est
--   pas arrivé, et vide pour un fichier brut (il est déjà dans chemin_original).
-- Le service s'en sert comme meilleure source et le recopie dans R2.

alter table public.photos
  add column chemin_source text unique check (chemin_source like siren || '/%'),
  add column octets_source bigint check (octets_source > 0);

comment on column public.photos.chemin_source is 'Fichier d origine en pleine résolution, envoyé après la version réduite (peut contenir des métadonnées : privé).';

-- L'app pose l'original une fois envoyé, rien d'autre.
grant update (chemin_source, octets_source) on public.photos to authenticated;
