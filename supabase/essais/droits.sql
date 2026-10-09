-- Essai des droits, à rejouer après chaque migration qui touche aux tables ou
-- aux politiques. Il crée deux artisans fictifs, A et B, chacun membre de sa
-- propre entreprise, essaie ce que A n'a pas le droit de faire, puis ANNULE
-- tout en levant une erreur qui porte le résultat. Rien ne reste dans la base.
--
-- Résultat attendu (2 octobre 2026, base sito) : chaque ligne marquée
-- « refuse » ou « 0 », aucune « FAUTE ».
--   A voit 1 entreprise(s) ; A ecrit chez B : refuse ; A ecrit chez lui :
--   accepte ; A declare une illustration : refuse ; A cree une entreprise :
--   refuse ; A modifie Sirene : 0 ligne(s) ; A voit 0 prospect(s) ;
--   telephone faux : refuse ; haut sous bas : refuse ; A pose son
--   telephone : accepte ; anonyme : refuse
--
-- À lancer dans l'éditeur SQL de Supabase, ou par l'outil execute_sql.

do $$
declare r text := ''; n int;
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
  insert into public.prospects (siren, metier, campagne) values ('849891528', 'ravalement', 'essai');

  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.entreprises; r := r || 'A voit ' || n || ' entreprise(s) ; ';
  begin insert into public.tarifs (siren, poste, bas, unite) values ('849891528', 'x', 1, 'EUR'); r := r || 'A ecrit chez B : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A ecrit chez B : refuse ; '; end;
  begin insert into public.tarifs (siren, poste, bas, haut, unite) values ('480423623', 'Enduit gratte', 48, 62, 'EUR/m2'); r := r || 'A ecrit chez lui : accepte ; ';
  exception when others then r := r || 'A ecrit chez lui : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  begin insert into public.photos (siren, role, origine, chemin_original) values ('480423623', 'geste', 'illustration', '480423623/x.jpg'); r := r || 'A declare une illustration : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A declare une illustration : refuse ; '; end;
  begin insert into public.entreprises (siren, denomination, nom_affiche) values ('111111111', 'x', 'x'); r := r || 'A cree une entreprise : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'A cree une entreprise : refuse ; '; end;
  begin update public.entreprises set denomination = 'pirate' where siren = '480423623'; get diagnostics n = row_count; r := r || 'A modifie Sirene : ' || n || ' ligne(s) ; ';
  exception when others then r := r || 'A modifie Sirene : refuse ; '; end;
  select count(*) into n from public.prospects; r := r || 'A voit ' || n || ' prospect(s) ; ';
  begin insert into public.profils (siren, telephone) values ('480423623', '04 91'); r := r || 'telephone faux : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'telephone faux : refuse ; '; end;
  begin insert into public.tarifs (siren, poste, bas, haut, unite) values ('480423623', 'y', 50, 10, 'EUR'); r := r || 'haut sous bas : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'haut sous bas : refuse ; '; end;
  begin insert into public.profils (siren, telephone, prix_affiches) values ('480423623', '0491234567', true); r := r || 'A pose son telephone : accepte ; ';
  exception when others then r := r || 'A pose son telephone : REFUSE (FAUTE) ' || sqlerrm || ' ; '; end;
  reset role;

  set local role anon;
  begin select count(*) into n from public.entreprises; r := r || 'anonyme voit ' || n || ' ; ';
  exception when others then r := r || 'anonyme : refuse ; '; end;
  reset role;

  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
