-- Mentions légales du site d'un abonné : ce que l'annuaire des entreprises ne
-- donne pas (tâche T50, constat S-004, docs/specs/S-MENTIONS.md).
--
-- Décision de Fabrice du 3 novembre 2026 (memoire/decisions.md) : « oui Q5 » :
-- les tâches de l'audit, dont T50 (mentions légales sur chaque site d'abonné),
-- passent avant le reste de l'app ; « tout doit être correct ».
--
-- Ce qui s'ajoute à `profils` (l'artisan l'écrit depuis l'app, écran
-- « Compte », droits de la table inchangés : lire, créer, modifier si membre) :
--   capital_social         ML3, société seulement, texte libre (« 10 000 € ») ;
--   immatriculation        ML6, « RCS Marseille 480 423 623 » ; vide : le site
--                          dit le SIREN et le registre national des entreprises ;
--   directeur_publication  ML9, le représentant légal ;
--   mediateur_adresse      ML10, l'adresse postale du médiateur (R. 616-1).
-- `courriel` (ML5) existait déjà ; l'app l'écrit désormais.
--
-- Sans adresse électronique ni directeur de la publication, le générateur
-- refuse de fabriquer le site d'abonné (generateur/sections/mentions.mjs).

alter table public.profils
  add column capital_social        text check (char_length(capital_social) <= 40),
  add column immatriculation       text check (char_length(immatriculation) <= 140),
  add column directeur_publication text check (char_length(directeur_publication) <= 140),
  add column mediateur_adresse     text check (char_length(mediateur_adresse) <= 280);

comment on column public.profils.directeur_publication is 'Nom du directeur de la publication du site (représentant légal). Mention obligatoire (LCEN).';
comment on column public.profils.mediateur_adresse is 'Adresse postale du médiateur de la consommation (Code de la consommation, R. 616-1).';
