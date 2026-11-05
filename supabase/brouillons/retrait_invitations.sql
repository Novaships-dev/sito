-- Retrait de l'inscription par lien (nettoyage du 5 novembre 2026).
-- Brouillon, à coller par Fabrice dans le SQL Editor de Supabase (action F23 de
-- memoire/actions-fabrice.md) : le mode automatique de Claude a refusé de
-- supprimer une table de la vraie base, et c'est juste que ce soit Fabrice qui
-- le fasse. Après, Claude le range dans supabase/migrations/ et rejoue les
-- essais de droits.
--
-- Décision de Fabrice du 5 nov. 2026 : il fournit à chaque artisan un
-- identifiant (son e-mail) et un mot de passe. Les comptes sont créés par
-- atelier/comptes.mjs ; le mot de passe oublié passe aussi par lui. Les liens
-- d'inscription et de reprise (migration 20261029181645_invitations) ne
-- servent plus.
--
-- Vérifié le 5 nov. avant d'écrire ce brouillon : la table ne contient que
-- deux liens déjà servis, tous deux du compte d'essai (SIREN 000000000).
-- Aucune donnée d'un artisan réel n'est perdue.

drop function if exists public.creer_invitation(text, text);
drop table if exists public.invitations;
