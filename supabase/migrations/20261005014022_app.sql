-- Sitô : ce que l'app demande en plus des douze tables du 2 octobre.
--
-- Source : app/PLAN-APP.md, section 7.5, et les décisions de Fabrice des
-- 3 et 5 octobre 2026 (toutes les photos acceptées, vidéos gardées, domaine
-- propre inclus, abonnement mensuel et annuel, réponses aux avis validées
-- par l'artisan).
--
-- Règles tenues ici :
--   - une seule table dit l'état de l'abonnement (`abonnements`) ;
--   - ce qui vient d'un tiers (Stripe, Google, Cloudflare) s'écrit par le
--     service, l'artisan le lit ;
--   - un jeton Google ne sort jamais du schéma privé ;
--   - le jour d'une statistique est le jour de Paris, pas celui d'UTC.

-- ---------------------------------------------------------------- jour de Paris
-- La base tourne en UTC : entre minuit et 2 h à Paris, current_date donne la
-- veille. Toute date « du jour » passe par cette fonction.
create or replace function prive.jour_paris(p_instant timestamptz default now())
returns date language sql stable set search_path = ''
as $$ select (p_instant at time zone 'Europe/Paris')::date $$;
grant execute on function prive.jour_paris(timestamptz) to authenticated, service_role;

-- ---------------------------------------------------------------- mentions légales
-- Obligatoires sur le site de l'artisan (identité, TVA, assurance, médiateur
-- de la consommation pour qui vend à des particuliers).
alter table public.profils
  add column tva_intra           text check (tva_intra ~ '^FR[0-9A-Z]{2}[0-9]{9}$'),
  add column decennale_assureur  text check (char_length(decennale_assureur) <= 140),
  add column decennale_contrat   text check (char_length(decennale_contrat) <= 60),
  add column decennale_zone      text check (char_length(decennale_zone) <= 140),
  add column mediateur_nom       text check (char_length(mediateur_nom) <= 140),
  add column mediateur_site      text check (mediateur_site ~ '^https://');

-- ---------------------------------------------------------------- photos et vidéos
-- Décision du 3 octobre : « Tout doit être accepté, iPhone etc., la totale. »
-- La photo reçue est gardée telle quelle (chemin_original) ; le service en
-- tire une image propre pour le site (chemin), sans métadonnées.
alter table public.photos
  add column format_origine  text check (char_length(format_origine) <= 24),
  add column chemin_original text unique check (chemin_original like siren || '/%'),
  add column etat            text not null default 'recue'
                               check (etat in ('recue', 'prete', 'illisible')),
  add column motif           text check (char_length(motif) <= 280);
-- La photo arrive « reçue » avec son original seulement ; le service la rend
-- « prête » en posant l'image propre (chemin), ou « illisible » avec le motif.
alter table public.photos alter column chemin drop not null;
alter table public.photos add constraint photos_prete_a_une_image
  check (etat <> 'prete' or chemin is not null);
alter table public.photos add constraint photos_a_un_fichier
  check (chemin is not null or chemin_original is not null);
-- L'app ne choisit ni l'état ni l'image propre : seul le service les écrit.
revoke insert, update on public.photos from authenticated;
grant insert (siren, chantier_id, role, paire, origine, chemin_original, format_origine, octets)
  on public.photos to authenticated;
grant update (chantier_id, role, paire) on public.photos to authenticated;
comment on column public.photos.chemin is 'Image propre pour le site (JPEG ou WebP, sans métadonnées).';
comment on column public.photos.chemin_original is 'Fichier tel que reçu de l appareil (HEIC, DNG, PNG...).';

-- Décision du 5 octobre : vidéos acceptées et gardées, montrées plus tard.
create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  siren        text not null references public.entreprises (siren) on delete cascade,
  chantier_id  uuid references public.chantiers (id) on delete cascade,
  chemin       text not null unique check (chemin like siren || '/%'),
  format       text check (char_length(format) <= 24),
  octets       bigint check (octets > 0),
  duree_s      numeric(8, 2) check (duree_s > 0),
  cree_le      timestamptz not null default now()
);
create index videos_siren on public.videos (siren);

-- ---------------------------------------------------------------- versions du site
-- Chaque publication est une version complète dans R2 (sites/<site>/<n>/).
-- Une seule version est en ligne ; la précédente reste pour revenir en arrière.
create table public.versions_site (
  site_id        uuid not null references public.sites (id) on delete cascade,
  numero         integer not null check (numero >= 1),
  fabrication_id uuid references public.fabrications (id) on delete set null,
  fichiers       integer not null check (fichiers >= 0),
  octets         bigint not null check (octets >= 0),
  en_ligne       boolean not null default false,
  publiee_le     timestamptz not null default now(),
  primary key (site_id, numero)
);
create unique index versions_site_une_en_ligne on public.versions_site (site_id) where en_ligne;

-- ---------------------------------------------------------------- adresses
-- Sous-domaine offert, domaine acheté au nom de l'artisan, ou domaine qu'il
-- possède déjà. Écrit par le service (Cloudflare, Gandi).
create table public.adresses (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites (id) on delete cascade,
  hote            text not null unique check (hote ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
  genre           text not null check (genre in ('offerte', 'achetee', 'existante')),
  principale      boolean not null default false,
  etat            text not null default 'en_attente'
                    check (etat in ('en_attente', 'active', 'echec', 'retiree')),
  cloudflare_id   text,
  registrar       text check (registrar in ('gandi')),
  echeance        date,
  motif           text check (char_length(motif) <= 280),
  cree_le         timestamptz not null default now(),
  mis_a_jour_le   timestamptz not null default now()
);
create index adresses_site on public.adresses (site_id);
create unique index adresses_une_principale on public.adresses (site_id) where principale;
create trigger adresses_maj before update on public.adresses
  for each row execute function prive.maj_horodatage();

-- ---------------------------------------------------------------- demandes
-- Les messages laissés par les visiteurs sur le formulaire du site. Reçus par
-- le service (champ piège, limite par adresse IP), jamais écrits par l'app.
create table public.demandes (
  id         uuid primary key default gen_random_uuid(),
  siren      text not null references public.entreprises (siren) on delete cascade,
  nom        text check (char_length(nom) <= 120),
  telephone  text check (char_length(telephone) <= 30),
  courriel   text check (char_length(courriel) <= 200),
  message    text not null check (char_length(message) between 1 and 4000),
  page       text check (char_length(page) <= 300),
  recue_le   timestamptz not null default now(),
  lue_le     timestamptz
);
create index demandes_siren on public.demandes (siren, recue_le desc);

-- ---------------------------------------------------------------- abonnement
-- Une seule source pour la formule et l'état du paiement, écrite par une seule
-- fonction du service, appelée par l'événement Stripe ET par le retour de
-- paiement. Décision du 5 octobre : mensuel et annuel.
create table public.abonnements (
  siren               text primary key references public.entreprises (siren) on delete cascade,
  formule             text not null check (formule in ('mensuel', 'annuel')),
  etat                text not null check (etat in ('essai', 'actif', 'impaye', 'resilie')),
  stripe_client       text unique,
  stripe_abonnement   text unique,
  fin_periode         timestamptz,
  resiliation_prevue  boolean not null default false,
  mis_a_jour_le       timestamptz not null default now()
);
create trigger abonnements_maj before update on public.abonnements
  for each row execute function prive.maj_horodatage();

-- Un événement Stripe rejoué n'écrit rien deux fois. Service seulement.
create table public.evenements_stripe (
  id        text primary key,
  type      text not null,
  recu_le   timestamptz not null default now()
);

-- ---------------------------------------------------------------- Google
-- L'état de la connexion, lisible par l'artisan.
create table public.connexions_google (
  siren          text primary key references public.entreprises (siren) on delete cascade,
  etat           text not null default 'a_connecter'
                   check (etat in ('a_connecter', 'connectee', 'revoquee', 'erreur')),
  compte         text,
  fiche          text,
  derniere_synchro timestamptz,
  motif          text check (char_length(motif) <= 280),
  mis_a_jour_le  timestamptz not null default now()
);
create trigger connexions_google_maj before update on public.connexions_google
  for each row execute function prive.maj_horodatage();

-- Le jeton lui-même, chiffré par le service avant d'arriver ici, dans le
-- schéma privé : aucune politique ne l'expose.
create table prive.jetons_google (
  siren          text primary key references public.entreprises (siren) on delete cascade,
  jeton_chiffre  bytea not null,
  portee         text not null,
  mis_a_jour_le  timestamptz not null default now()
);
revoke all on prive.jetons_google from public, anon, authenticated;

-- Réponses préparées aux avis (décision du 5 octobre) : jamais publiées sans
-- la validation de l'artisan.
alter table public.avis
  add column brouillon      text check (char_length(brouillon) <= 4096),
  add column brouillon_le   timestamptz,
  add column valide_par     uuid references auth.users (id) on delete set null,
  add column valide_le      timestamptz;

-- ---------------------------------------------------------------- suppression de compte
-- 30 jours pour changer d'avis ; le service supprime à l'échéance.
create table public.suppressions (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  demandee_le  timestamptz not null default now(),
  effective_le timestamptz not null default (now() + interval '30 days'),
  annulee_le   timestamptz,
  check (effective_le > demandee_le)
);

-- ---------------------------------------------------------------- droits
alter table public.videos            enable row level security;
alter table public.versions_site     enable row level security;
alter table public.adresses          enable row level security;
alter table public.demandes          enable row level security;
alter table public.abonnements       enable row level security;
alter table public.evenements_stripe enable row level security;
alter table public.connexions_google enable row level security;
alter table public.suppressions      enable row level security;
alter table prive.jetons_google      enable row level security;

-- Écrit par le service, lu par l'artisan.
create policy versions_site_lire on public.versions_site for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and (select prive.est_membre(s.siren))));
create policy adresses_lire on public.adresses for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and (select prive.est_membre(s.siren))));
create policy abonnements_lire on public.abonnements for select to authenticated
  using ((select prive.est_membre(siren)));
create policy connexions_google_lire on public.connexions_google for select to authenticated
  using ((select prive.est_membre(siren)));

-- Demandes : l'artisan les lit et les marque lues, rien d'autre.
create policy demandes_lire on public.demandes for select to authenticated
  using ((select prive.est_membre(siren)));
create policy demandes_marquer on public.demandes for update to authenticated
  using ((select prive.est_membre(siren))) with check ((select prive.est_membre(siren)));
revoke update on public.demandes from authenticated;
grant update (lue_le) on public.demandes to authenticated;

-- Avis : l'artisan peut valider un brouillon, pas réécrire l'avis du client.
create policy avis_valider on public.avis for update to authenticated
  using ((select prive.est_membre(siren)))
  with check ((select prive.est_membre(siren)) and (valide_par is null or valide_par = (select auth.uid())));
revoke update on public.avis from authenticated;
grant update (brouillon, valide_par, valide_le) on public.avis to authenticated;

-- Vidéos : comme les photos.
create policy videos_lire on public.videos for select to authenticated
  using ((select prive.est_membre(siren)));
create policy videos_creer on public.videos for insert to authenticated
  with check ((select prive.est_membre(siren))
    and (chantier_id is null or exists (select 1 from public.chantiers c where c.id = chantier_id and c.siren = videos.siren)));
create policy videos_supprimer on public.videos for delete to authenticated
  using ((select prive.est_membre(siren)));

-- Suppression : chacun demande et annule la sienne.
create policy suppressions_lire on public.suppressions for select to authenticated
  using (user_id = (select auth.uid()));
create policy suppressions_demander on public.suppressions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy suppressions_annuler on public.suppressions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.suppressions from authenticated;
grant update (annulee_le) on public.suppressions to authenticated;
-- Le délai de 30 jours n'est pas négociable depuis l'app.
revoke insert on public.suppressions from authenticated;
grant insert (user_id) on public.suppressions to authenticated;

-- evenements_stripe, prive.jetons_google : aucune politique, service seulement.
revoke all on public.videos, public.versions_site, public.adresses, public.demandes,
  public.abonnements, public.evenements_stripe, public.connexions_google,
  public.suppressions from anon;

-- ---------------------------------------------------------------- stockage
-- Tout format accepté à l'entrée : le service trie. 50 Mo est le plafond de
-- l'offre gratuite ; à passer à 150 Mo avec l'offre Pro (ProRAW : 75 Mo).
update storage.buckets
   set file_size_limit = 52428800, allowed_mime_types = null
 where id = 'photos-chantiers';
