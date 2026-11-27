-- Essai des droits de l'espace de prospection (migration …_prospection, T70).
-- Même principe que droits-app.sql : un prospecteur fictif P et un artisan
-- fictif A, tout est annulé à la fin par une erreur qui porte le résultat.
-- Aucune ligne « FAUTE » attendue. Avant la migration, l'essai rougit (tables
-- absentes) : c'est la copie cassée.

do $$
declare r text := ''; n int; pid uuid; pid2 uuid;
  up uuid := '00000000-0000-4000-8000-0000000000f0';
  ua uuid := '00000000-0000-4000-8000-0000000000f1';
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values (up, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p@essai.invalid'),
         (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a2@essai.invalid');
  insert into public.prospecteurs (user_id) values (up);
  -- ce que la soirée écrit (clé de service)
  insert into public.fiches_prospection (nom, metier, commune, telephone, a_appeler_le, source)
  values ('Essai Façades', 'Ravalement', 'Aubagne', '06 39 98 00 01', prive.jour_paris(now()), 'soiree') returning id into pid;
  insert into public.fiches_prospection (nom, metier, telephone, a_appeler_le, source)
  values ('Essai Hier', 'Peinture', '06 39 98 00 02', prive.jour_paris(now()) - 1, 'soiree') returning id into pid2;

  -- l'artisan A ne voit rien
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.fiches_prospection; r := r || 'artisan voit ' || n || ' prospect(s)' || case when n = 0 then '' else ' (FAUTE)' end || ' ; ';
  begin insert into public.fiches_prospection (nom) values ('pirate'); r := r || 'artisan ajoute : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'artisan ajoute : refuse ; '; end;
  begin insert into public.prospecteurs (user_id) values (ua); r := r || 'artisan se fait prospecteur : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'artisan se fait prospecteur : refuse ; '; end;
  update public.fiches_prospection set statut = 'refuse', a_appeler_le = null where id = pid; get diagnostics n = row_count;
  r := r || 'artisan modifie : ' || case when n = 0 then 'refuse' else 'ACCEPTE (FAUTE)' end || ' ; ';
  reset role;

  -- le prospecteur P lit, écrit, ajoute
  perform set_config('request.jwt.claims', json_build_object('sub', up, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.fiches_prospection; r := r || 'prospecteur voit ' || n || ' prospect(s) ; ';
  update public.fiches_prospection set statut = 'a-rappeler', a_appeler_le = prive.jour_paris(now()) + 1, rappel_heure = '10:30' where id = pid; get diagnostics n = row_count;
  r := r || 'prospecteur enregistre un rappel : ' || n || ' ; ';
  insert into public.appels_prospection (prospect_id, statut) values (pid, 'a-rappeler');
  select count(*) into n from public.appels_prospection where auteur = up; r := r || 'appel signe du prospecteur : ' || n || ' ; ';
  begin update public.fiches_prospection set statut = 'refuse' where id = pid; r := r || 'refus laisse dans la liste : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'refus laisse dans la liste : refuse ; '; end;
  begin update public.fiches_prospection set statut = 'a-rappeler', a_appeler_le = null where id = pid; r := r || 'rappel sans date : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'rappel sans date : refuse ; '; end;
  begin update public.fiches_prospection set statut = 'vendu' where id = pid; r := r || 'statut inconnu : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'statut inconnu : refuse ; '; end;
  insert into public.fiches_prospection (nom, metier, telephone, a_appeler_le) values ('Ajout main', 'Maçon', '06 39 98 00 03', prive.jour_paris(now()) + 2);
  r := r || 'prospecteur ajoute a la main : accepte ; ';
  begin delete from public.fiches_prospection where id = pid; get diagnostics n = row_count;
    r := r || 'prospecteur supprime : ' || case when n = 0 then 'refuse' else 'ACCEPTE (FAUTE)' end || ' ; ';
  exception when others then r := r || 'prospecteur supprime : refuse ; '; end;
  begin perform prive.purger_numeros_prospection(); r := r || 'prospecteur lance la purge : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'prospecteur lance la purge : refuse ; '; end;
  reset role;

  -- l'anonyme ne voit rien
  set local role anon;
  begin select count(*) into n from public.fiches_prospection; r := r || 'anonyme voit ' || n || ' (FAUTE) ; ';
  exception when others then r := r || 'anonyme : refuse ; '; end;
  reset role;

  -- la purge : le numéro d'hier part, celui d'un rappel futur ajouté à la main reste,
  -- celui du rappel de demain (fiche de la soirée) reste jusqu'à demain
  perform prive.purger_numeros_prospection();
  select count(*) into n from public.fiches_prospection where id = pid2 and telephone is null; r := r || 'numero d hier efface : ' || n || ' ; ';
  select count(*) into n from public.fiches_prospection where nom = 'Ajout main' and telephone is not null; r := r || 'numero d un ajout futur garde : ' || n || ' ; ';

  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
