-- L'espace « Chiffres » de Fabrice (T72) : ce que MonSiteArtisan encaisse.
--
-- Décision du 27 nov. 2026 : « il faudrait aussi un espace chiffre ou je vois ce
-- que je gagne par rapport au abonnement et site vendu one shot ou abonnement
-- voir mon chiffre d'affaire en temps réel sur le jour la semaine le mois
-- l'année ». Réponses : « L'offre 720€/ ans c'est le "one shot" » ; « Oui
-- l'argent réel encaissé et je veut une courbe aussi comme les graphique de
-- bourse » ; estimation après cotisations : « Oui aussi » ; saisie à la main
-- puis Stripe : « Oui ».
--
-- ventes        : un artisan qui a signé : au mois (80 €, 12 mois d'engagement,
--                 1 mois offert) ou à l'année (720 €, le « one shot »).
-- encaissements : l'argent réellement reçu, une ligne par paiement. Saisi à la
--                 main pour l'instant ; Stripe écrira ici plus tard (source
--                 'stripe', stripe_ref unique, par la clé de service).
-- Droits : les prospecteurs seulement (prive.est_prospecteur()), comme la
-- prospection. Un encaissement saisi par erreur peut être retiré par eux ; un
-- encaissement de Stripe ne peut pas l'être depuis l'app.

create table public.ventes (
  id        uuid primary key default gen_random_uuid(),
  fiche_id  uuid references public.fiches_prospection (id) on delete set null,
  nom       text not null check (length(nom) between 1 and 160),
  formule   text not null check (formule in ('mensuel', 'annuel')),
  debut_le  date not null default prive.jour_paris(now()),
  etat      text not null default 'active' check (etat in ('active', 'terminee')),
  cree_le   timestamptz not null default now()
);
create index ventes_fiche on public.ventes (fiche_id);
alter table public.ventes enable row level security;
revoke all on public.ventes from public, anon, authenticated;
grant select, insert, update on public.ventes to authenticated;
create policy ventes_lire on public.ventes for select to authenticated using ((select prive.est_prospecteur()));
create policy ventes_ajouter on public.ventes for insert to authenticated with check ((select prive.est_prospecteur()));
create policy ventes_modifier on public.ventes for update to authenticated
  using ((select prive.est_prospecteur())) with check ((select prive.est_prospecteur()));

create table public.encaissements (
  id          uuid primary key default gen_random_uuid(),
  vente_id    uuid references public.ventes (id) on delete set null,
  nom         text not null check (length(nom) between 1 and 160),
  formule     text not null check (formule in ('mensuel', 'annuel', 'autre')),
  montant     numeric(10,2) not null check (montant > 0 and montant < 100000),
  encaisse_le date not null default prive.jour_paris(now()),
  note        text check (length(note) <= 500),
  source      text not null default 'manuel' check (source in ('manuel', 'stripe')),
  stripe_ref  text unique,
  cree_le     timestamptz not null default now()
);
create index encaissements_jour on public.encaissements (encaisse_le);
create index encaissements_vente on public.encaissements (vente_id);
alter table public.encaissements enable row level security;
revoke all on public.encaissements from public, anon, authenticated;
grant select, insert, delete on public.encaissements to authenticated;
create policy encaissements_lire on public.encaissements for select to authenticated using ((select prive.est_prospecteur()));
create policy encaissements_ajouter on public.encaissements for insert to authenticated
  with check ((select prive.est_prospecteur()) and source = 'manuel' and stripe_ref is null);
create policy encaissements_retirer on public.encaissements for delete to authenticated
  using ((select prive.est_prospecteur()) and source = 'manuel');
