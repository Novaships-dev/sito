-- Sitô : le stockage des images.
--
-- photos-chantiers : les photos de l'artisan, privées, rangées sous
--   <siren>/<chantier>/<fichier>. Un artisan n'écrit et ne lit que dans le
--   dossier de ses entreprises.
-- banque : les images générées par métier (32 par métier, voir
--   banque/liste-images.md), privées, lues par le générateur avec la clé de
--   service. Elles ne vont pas dans Git (décision de Fabrice : pas de Git LFS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos-chantiers', 'photos-chantiers', false, 15728640,
     array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('banque', 'banque', false, 15728640,
     array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy photos_chantiers_lire on storage.objects for select to authenticated
  using (bucket_id = 'photos-chantiers' and (select prive.est_membre((storage.foldername(name))[1])));
create policy photos_chantiers_creer on storage.objects for insert to authenticated
  with check (bucket_id = 'photos-chantiers' and (select prive.est_membre((storage.foldername(name))[1])));
create policy photos_chantiers_modifier on storage.objects for update to authenticated
  using (bucket_id = 'photos-chantiers' and (select prive.est_membre((storage.foldername(name))[1])))
  with check (bucket_id = 'photos-chantiers' and (select prive.est_membre((storage.foldername(name))[1])));
create policy photos_chantiers_supprimer on storage.objects for delete to authenticated
  using (bucket_id = 'photos-chantiers' and (select prive.est_membre((storage.foldername(name))[1])));
-- banque : aucune politique, donc service seulement.
