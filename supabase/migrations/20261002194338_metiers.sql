-- Sitô : les seize métiers, recopiés de generateur/banque/plan-images.json.
-- Les codes APE sont ceux du plan d'images ; ils ne suffisent pas à dire qui
-- fait quoi (43.34Z couvre peinture et vitrerie) et servent de premier filtre.

insert into public.metiers (cle, libelle, mot, codes_ape) values
  ('ravalement', 'Ravalement de façade', 'Ravalement', array['43.34Z', '43.33Z', '43.99C']::text[]),
  ('peinture', 'Peinture intérieure', 'Peinture', array['43.34Z']::text[]),
  ('maconnerie', 'Maçonnerie générale', 'Maçonnerie', array['43.99C', '43.91B']::text[]),
  ('couverture', 'Couverture et zinguerie', 'Toiture', array['43.91B', '43.91A']::text[]),
  ('menuiserie', 'Menuiserie et fenêtres', 'Menuiserie', array['43.32A', '43.32B']::text[]),
  ('carrelage', 'Carrelage et faïence', 'Carrelage', array['43.33Z']::text[]),
  ('platrerie', 'Plâtrerie et cloisons', 'Plâtrerie', array['43.31Z']::text[]),
  ('isolation', 'Isolation extérieure', 'Isolation', array['43.29A']::text[]),
  ('electricite', 'Électricité', 'Électricité', array['43.21A']::text[]),
  ('plomberie', 'Plomberie et chauffage', 'Plomberie', array['43.22A', '43.22B']::text[]),
  ('metallerie', 'Serrurerie et portails', 'Métallerie', array['43.32B', '25.11Z']::text[]),
  ('terrassement', 'Terrassement et VRD', 'Terrassement', array['43.12A']::text[]),
  ('etancheite', 'Étanchéité toiture-terrasse', 'Étanchéité', array['43.99A']::text[]),
  ('parquet', 'Parquet et sols souples', 'Parquet', array['43.33Z']::text[]),
  ('piscine', 'Piscine', 'Piscine', array['43.99C']::text[]),
  ('paysagiste', 'Paysagiste', 'Jardin', array['81.30Z']::text[])
on conflict (cle) do update set libelle = excluded.libelle, mot = excluded.mot, codes_ape = excluded.codes_ape;
