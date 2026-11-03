-- Essai des droits des tables de l'app (migration 20261005014022_app), à
-- rejouer après chaque migration qui y touche. Même principe que droits.sql :
-- deux artisans fictifs A et B, tout est annulé à la fin par une erreur qui
-- porte le résultat. Aucune ligne « FAUTE » attendue.

do $$
declare r text := ''; n int; d uuid; db uuid; a uuid;
  ua uuid := '00000000-0000-4000-8000-00000000000a';
  ub uuid := '00000000-0000-4000-8000-00000000000b';
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@essai.invalid'),
         (ub, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@essai.invalid');
  insert into public.entreprises (siren, denomination, nom_affiche, commune, code_postal, departement)
  values ('480423623', 'SUD RAVALEMENT FACADES', 'Sud Ravalement Façades', 'Marseille', '13015', '13'),
         ('849891528', 'PROVENCE RAVALEMENT PEINTURE', 'Provence Ravalement Peinture', 'Marseille', '13010', '13');
  insert into public.membres (user_id, siren) values (ua, '480423623'), (ub, '849891528');
  -- Ce que le service écrit (clé de service) :
  insert into public.demandes (siren, message) values ('480423623', 'Bonjour, devis façade ?') returning id into d;
  insert into public.demandes (siren, message) values ('849891528', 'Message pour B') returning id into db;
  insert into public.abonnements (siren, formule, etat) values ('849891528', 'annuel', 'actif');
  insert into public.avis (siren, ref_externe, note, texte) values ('480423623', 'essai-1', 5, 'Très bon travail') returning id into a;
  insert into prive.jetons_google (siren, jeton_chiffre, portee) values ('480423623', '\x00'::bytea, 'business.manage');
  insert into public.profils (siren) values ('849891528') on conflict (siren) do nothing;

  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.demandes; r := r || 'A voit ' || n || ' demande(s) ; ';
  update public.demandes set lue_le = now() where id = d; get diagnostics n = row_count;
  r := r || 'A marque sa demande lue : ' || n || ' ; ';
  update public.demandes set lue_le = now() where id = db; get diagnostics n = row_count;
  r := r || 'A marque une demande de B : ' || n || ' ; ';
  begin update public.demandes set message = 'pirate' where id = d; r := r || 'A reecrit un message : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A reecrit un message : refuse ; '; end;

  select count(*) into n from public.abonnements; r := r || 'A voit ' || n || ' abonnement(s) de B ; ';
  begin insert into public.abonnements (siren, formule, etat) values ('480423623', 'annuel', 'actif'); r := r || 'A se donne un abonnement : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A se donne un abonnement : refuse ; '; end;

  begin select count(*) into n from prive.jetons_google; r := r || 'A lit les jetons Google : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A lit les jetons Google : refuse ; '; end;

  begin insert into public.photos (siren, role, chemin_original, format_origine) values ('480423623', 'chantier', '480423623/x/IMG_0001.HEIC', 'heic');
    r := r || 'A envoie une photo HEIC : accepte ; ';
  exception when others then r := r || 'A envoie une photo HEIC : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  -- Migration 20261009005808 : l'original suit la photo réduite.
  begin update public.photos set chemin_source = '480423623/x/IMG_0001-original.heic', octets_source = 3000000
     where chemin_original = '480423623/x/IMG_0001.HEIC'; get diagnostics n = row_count;
    r := r || 'A pose l original de sa photo : ' || case when n = 1 then 'accepte' else 'REFUSE (FAUTE)' end || ' ; ';
  exception when others then r := r || 'A pose l original de sa photo : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  begin update public.photos set chemin_source = '849891528/x/vol.heic' where chemin_original = '480423623/x/IMG_0001.HEIC';
    r := r || 'A range son original chez B : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A range son original chez B : refuse ; '; end;
  begin update public.photos set chemin = '480423623/x/faux.webp' where chemin_original = '480423623/x/IMG_0001.HEIC';
    r := r || 'A pose l image propre : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A pose l image propre : refuse ; '; end;
  begin insert into public.photos (siren, role, chemin_original, etat, chemin) values ('480423623', 'chantier', '480423623/x/b.jpg', 'prete', '480423623/x/b.webp');
    r := r || 'A declare sa photo prete : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A declare sa photo prete : refuse ; '; end;

  update public.avis set brouillon = 'Merci beaucoup !', valide_par = ua, valide_le = now() where id = a; get diagnostics n = row_count;
  r := r || 'A valide sa reponse : ' || n || ' ; ';
  begin update public.avis set texte = 'Travail nul' where id = a; r := r || 'A reecrit l avis du client : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A reecrit l avis du client : refuse ; '; end;
  begin update public.avis set valide_par = ub where id = a; get diagnostics n = row_count;
    r := r || 'A valide au nom de B : ' || case when n = 0 then 'refuse' else 'ACCEPTE (FAUTE)' end || ' ; ';
  exception when others then r := r || 'A valide au nom de B : refuse ; '; end;

  begin insert into public.suppressions (user_id, effective_le) values (ua, now() + interval '1 minute'); r := r || 'A raccourcit le delai : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A raccourcit le delai : refuse ; '; end;
  -- Mentions légales (migration 20261103143933_mentions_legales, T50).
  begin insert into public.profils (siren, courriel, capital_social, immatriculation, directeur_publication, mediateur_adresse)
    values ('480423623', 'a@essai.invalid', '10 000 €', 'RCS Marseille 480 423 623', 'Jeanne Essai', '1 rue de la Médiation, 75001 Paris')
    on conflict (siren) do update set courriel = excluded.courriel, capital_social = excluded.capital_social,
      immatriculation = excluded.immatriculation, directeur_publication = excluded.directeur_publication,
      mediateur_adresse = excluded.mediateur_adresse;
    r := r || 'A ecrit ses mentions legales : accepte ; ';
  exception when others then r := r || 'A ecrit ses mentions legales : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  update public.profils set directeur_publication = 'pirate' where siren = '849891528'; get diagnostics n = row_count;
  r := r || 'A ecrit le directeur de B : ' || case when n = 0 then 'refuse' else 'ACCEPTE (FAUTE)' end || ' ; ';
  begin update public.profils set capital_social = repeat('9', 41) where siren = '480423623'; r := r || 'A pose un capital de 41 caracteres : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A pose un capital de 41 caracteres : refuse ; '; end;
  begin insert into public.suppressions (user_id) values (ua); r := r || 'A demande la suppression : accepte ; ';
  exception when others then r := r || 'A demande la suppression : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  begin insert into public.suppressions (user_id) values (ub); r := r || 'A supprime B : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A supprime B : refuse ; '; end;
  reset role;

  set local role anon;
  begin select count(*) into n from public.demandes; r := r || 'anonyme voit ' || n || ' demande(s) (FAUTE) ; ';
  exception when others then r := r || 'anonyme : refuse ; '; end;
  reset role;

  r := r || 'jour de Paris pour 23 h 30 UTC le 5 : ' || prive.jour_paris('2026-10-05 23:30:00+00');
  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
