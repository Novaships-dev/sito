-- Sitô : le schéma de la base.
--
-- Décision de Fabrice, 2 octobre 2026 : « La base Supabase doit être solide
-- pour être tranquille et penser à la suite. » Ce qui en découle ici :
--   - chaque règle métier vit dans une contrainte, pas seulement dans le code ;
--   - les faits publics (Sirene) et ce que dit l'artisan sont séparés ;
--   - l'apparence d'un site est figée à sa création (sites.charte) ;
--   - tout ce que l'app écrit est rattaché à une entreprise par son SIREN, et
--     un artisan ne voit que les entreprises dont il est membre (voir la
--     migration des droits).
--
-- Les migrations se rejouent dans l'ordre : ne jamais en modifier une qui a
-- déjà tourné, en écrire une nouvelle.

create extension if not exists pgcrypto with schema extensions;

-- Schéma privé : les fonctions d'aide, jamais exposées par l'API.
create schema if not exists prive;
revoke all on schema prive from public, anon;
grant usage on schema prive to authenticated, service_role;

-- Horodatage de mise à jour, posé par un déclencheur.
create or replace function prive.maj_horodatage()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.mis_a_jour_le := now();
  return new;
end $$;

-- ---------------------------------------------------------------- référence
create table public.metiers (
  cle        text primary key check (cle ~ '^[a-z]+$'),
  libelle    text not null,
  mot        text not null,
  codes_ape  text[] not null default '{}'
);
comment on table public.metiers is 'Les seize métiers du générateur. Référence, écrite par les migrations.';

-- ---------------------------------------------------------------- entreprises
-- Les faits publics, recopiés de Sirene. L'artisan ne les modifie pas : ils
-- se mettent à jour depuis la source.
create table public.entreprises (
  siren             text primary key check (siren ~ '^[0-9]{9}$'),
  denomination      text not null,
  nom_affiche       text not null,
  siret_siege       text check (siret_siege ~ '^[0-9]{14}$'),
  adresse           text,
  commune           text,
  code_postal       text check (code_postal ~ '^[0-9]{5}$'),
  departement       text check (departement ~ '^([0-9]{2}|2A|2B|9[78][0-9])$'),
  code_ape          text check (code_ape ~ '^[0-9]{2}\.[0-9]{2}[A-Z]$'),
  forme_juridique   text,
  date_creation     date,
  tranche_effectif  text,
  rge               boolean,
  sirene            jsonb not null default '{}'::jsonb,
  sirene_lu_le      timestamptz,
  cree_le           timestamptz not null default now(),
  mis_a_jour_le     timestamptz not null default now()
);
comment on table public.entreprises is 'Faits publics Sirene. Écrits par le service, jamais par l artisan.';
create index entreprises_departement on public.entreprises (departement);
create trigger entreprises_maj before update on public.entreprises
  for each row execute function prive.maj_horodatage();

-- Qui a accès à quelle entreprise. Écrit par le service à l'inscription,
-- après vérification que la personne représente bien l'entreprise.
create table public.membres (
  user_id  uuid not null references auth.users (id) on delete cascade,
  siren    text not null references public.entreprises (siren) on delete cascade,
  role     text not null default 'titulaire' check (role in ('titulaire', 'collaborateur')),
  cree_le  timestamptz not null default now(),
  primary key (user_id, siren)
);
create index membres_siren on public.membres (siren);

-- Ce que dit l'artisan, et que Sirene ne dit pas.
-- prix_affiches : décision de Fabrice, 2 octobre 2026, « c'est l'artisan qui
-- coche une case pour activer ça ou pas, et ensuite ajouter ses tarifs ».
create table public.profils (
  siren          text primary key references public.entreprises (siren) on delete cascade,
  telephone      text check (telephone ~ '^0[1-9][0-9]{8}$'),
  courriel       text check (courriel ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  horaires       jsonb,
  prix_affiches  boolean not null default false,
  prix_mention   text check (char_length(prix_mention) <= 280),
  cree_le        timestamptz not null default now(),
  mis_a_jour_le  timestamptz not null default now()
);
comment on column public.profils.telephone is 'Dix chiffres, sans espace : 0491234567. Le générateur le met en forme.';
create trigger profils_maj before update on public.profils
  for each row execute function prive.maj_horodatage();

-- Les tarifs de l'artisan. Affichés seulement si profils.prix_affiches.
create table public.tarifs (
  id             uuid primary key default gen_random_uuid(),
  siren          text not null references public.entreprises (siren) on delete cascade,
  poste          text not null check (char_length(poste) between 1 and 120),
  bas            numeric(12, 2) not null check (bas >= 0),
  haut           numeric(12, 2) check (haut is null or haut >= bas),
  unite          text not null check (char_length(unite) between 1 and 24),
  note           text check (char_length(note) <= 280),
  rang           integer not null default 0,
  cree_le        timestamptz not null default now(),
  mis_a_jour_le  timestamptz not null default now()
);
create index tarifs_siren on public.tarifs (siren, rang);
create trigger tarifs_maj before update on public.tarifs
  for each row execute function prive.maj_horodatage();

-- ---------------------------------------------------------------- sites
-- Un site par entreprise et par métier. La charte (archétype, couleurs,
-- polices, structure, comparateur, appel) est tirée une fois et FIGÉE : un
-- site ne change pas de visage parce qu'une photo a été ajoutée. Cette table
-- remplace generateur/registre.json et sert au contrôle d'unicité, d'où les
-- index par métier et commune, par métier et département.
create table public.sites (
  id              uuid primary key default gen_random_uuid(),
  siren           text not null references public.entreprises (siren) on delete cascade,
  metier          text not null references public.metiers (cle),
  archetype       text not null check (archetype in ('matiere', 'panneau', 'planche', 'elevation')),
  charte          jsonb not null,
  main_photos     jsonb not null default '{}'::jsonb,
  titre           text not null,
  phrases         text[] not null default '{}',
  commune         text,
  departement     text check (departement ~ '^([0-9]{2}|2A|2B|9[78][0-9])$'),
  statut          text not null default 'prospection'
                    check (statut in ('prospection', 'abonne', 'publie', 'suspendu', 'archive')),
  version         integer not null default 1 check (version >= 1),
  adresse_en_ligne text,
  publie_le       timestamptz,
  cree_le         timestamptz not null default now(),
  mis_a_jour_le   timestamptz not null default now(),
  unique (siren, metier)
);
create index sites_metier_departement on public.sites (metier, departement);
create index sites_metier_commune on public.sites (metier, commune);
create trigger sites_maj before update on public.sites
  for each row execute function prive.maj_horodatage();

-- Chaque fabrication, avec le résultat des cinq vérificateurs. Une fabrication
-- refusée ne remplace jamais le site en ligne.
create table public.fabrications (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites (id) on delete cascade,
  version        integer not null check (version >= 1),
  images         text not null check (images in ('illustration', 'entreprise')),
  statut         text not null default 'en_cours' check (statut in ('en_cours', 'reussie', 'refusee', 'erreur')),
  verifications  jsonb not null default '{}'::jsonb,
  debut          timestamptz not null default now(),
  fin            timestamptz,
  check (fin is null or fin >= debut)
);
create index fabrications_site on public.fabrications (site_id, debut desc);

-- ---------------------------------------------------------------- chantiers et photos
create table public.chantiers (
  id             uuid primary key default gen_random_uuid(),
  siren          text not null references public.entreprises (siren) on delete cascade,
  titre          text check (char_length(titre) <= 140),
  commune        text,
  termine_le     date,
  description    text check (char_length(description) <= 2000),
  publie         boolean not null default false,
  cree_le        timestamptz not null default now(),
  mis_a_jour_le  timestamptz not null default now()
);
create index chantiers_siren on public.chantiers (siren, termine_le desc);
create trigger chantiers_maj before update on public.chantiers
  for each row execute function prive.maj_horodatage();

-- Une photo est dans le stockage (bucket photos-chantiers), au chemin
-- <siren>/<chantier>/<fichier>. Une paire avant / après partage son numéro
-- de paire dans le chantier.
create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  siren        text not null references public.entreprises (siren) on delete cascade,
  chantier_id  uuid references public.chantiers (id) on delete cascade,
  role         text not null check (role in ('avant', 'apres', 'chantier', 'geste', 'detail')),
  paire        smallint check (paire >= 1),
  origine      text not null default 'entreprise' check (origine in ('entreprise', 'illustration')),
  chemin       text not null unique,
  largeur      integer check (largeur > 0),
  hauteur      integer check (hauteur > 0),
  octets       integer check (octets > 0),
  cree_le      timestamptz not null default now(),
  check (role not in ('avant', 'apres') or (chantier_id is not null and paire is not null)),
  check (chemin like siren || '/%')
);
create unique index photos_une_par_paire on public.photos (chantier_id, paire, role)
  where role in ('avant', 'apres');
create index photos_siren on public.photos (siren);
create index photos_chantier on public.photos (chantier_id);

-- ---------------------------------------------------------------- avis et statistiques
-- Écrits par le service (récupération des avis Google, mesure d'audience).
create table public.avis (
  id            uuid primary key default gen_random_uuid(),
  siren         text not null references public.entreprises (siren) on delete cascade,
  source        text not null default 'google' check (source in ('google')),
  ref_externe   text not null,
  auteur        text,
  note          smallint check (note between 1 and 5),
  texte         text,
  ecrit_le      timestamptz,
  reponse       text,
  repondu_le    timestamptz,
  chantier_id   uuid references public.chantiers (id) on delete set null,
  recupere_le   timestamptz not null default now(),
  unique (source, ref_externe)
);
create index avis_siren on public.avis (siren, ecrit_le desc);
create index avis_chantier on public.avis (chantier_id);

create table public.statistiques (
  siren     text not null references public.entreprises (siren) on delete cascade,
  jour      date not null,
  page      text not null default '/',
  source    text not null default 'tout',
  visites   integer not null default 0 check (visites >= 0),
  appels    integer not null default 0 check (appels >= 0),
  demandes  integer not null default 0 check (demandes >= 0),
  primary key (siren, jour, page, source)
);

-- ---------------------------------------------------------------- prospection
-- Le suivi de campagne de skills/prospection-sirene (étape 6). Interne :
-- aucun artisan n'y a accès, seul le service lit et écrit.
create table public.prospects (
  siren           text primary key references public.entreprises (siren) on delete cascade,
  metier          text not null references public.metiers (cle),
  campagne        text not null,
  qualification   text check (qualification in ('prioritaire', 'bonne', 'ecartee')),
  envoye_le       timestamptz,
  ouvert_le       timestamptz,
  lecture_secondes integer check (lecture_secondes >= 0),
  contacte_le     timestamptz,
  reponse         text,
  relance_prevue  date,
  statut          text not null default 'a_envoyer'
                    check (statut in ('a_envoyer', 'envoye', 'ouvert', 'contacte', 'abonne', 'refus', 'ne_plus_contacter')),
  cree_le         timestamptz not null default now(),
  mis_a_jour_le   timestamptz not null default now()
);
create index prospects_metier on public.prospects (metier, statut);
create trigger prospects_maj before update on public.prospects
  for each row execute function prive.maj_horodatage();
