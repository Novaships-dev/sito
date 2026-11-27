-- Essai de prive.verser_fiches (migration …_analyse_prospection, T73) : les
-- mêmes règles que scripts/prospection/vers-espace.mjs. Tout est annulé à la
-- fin. Aucune ligne « FAUTE » attendue.

do $$
declare r text := ''; n int; b jsonb; j date := '2026-11-30';
  ua uuid := '00000000-0000-4000-8000-0000000000d1';
begin
  insert into public.fiches_prospection (siren, nom, statut, a_appeler_le, source) values ('111111111', 'Déjà refusé', 'refuse', null, 'soiree');
  insert into public.fiches_prospection (siren, nom, statut, a_appeler_le, notes, source) values ('222222222', 'Rappel lundi', 'a-rappeler', j, 'Après 10 h', 'soiree');
  insert into public.fiches_prospection (siren, nom, statut, a_appeler_le, source) values ('333333333', 'Rappel plus tard', 'a-rappeler', j + 10, 'soiree');
  b := prive.verser_fiches(jsonb_build_array(
    jsonb_build_object('siren', '444444444', 'nom', 'Nouveau', 'metier', 'Ravalement', 'telephone', '+33639980001',
      'diagnostic', jsonb_build_object('resume', 'Créée en 2014', 'questions', jsonb_build_array('Qui fait vos devis ?'))),
    jsonb_build_object('siren', '111111111', 'nom', 'Déjà refusé', 'telephone', '0639980002'),
    jsonb_build_object('siren', '222222222', 'nom', 'Rappel lundi', 'telephone', '06 39 98 00 22', 'angle', 'Nouvel angle'),
    jsonb_build_object('siren', '333333333', 'nom', 'Rappel plus tard', 'telephone', '06 39 98 00 33'),
    jsonb_build_object('siren', '555555555', 'nom', 'Numéro faux', 'telephone', '12'),
    jsonb_build_object('nom', 'Sans siren')), j);
  r := r || 'bilan ' || (b->>'crees') || ' cree, ' || (b->>'mises_a_jour') || ' mises a jour, ' || (b->>'numeros') || ' numeros, ' || jsonb_array_length(b->'ecartees') || ' ecartees ; ';
  select count(*) into n from public.fiches_prospection where siren = '444444444' and telephone = '06 39 98 00 01' and a_appeler_le = j and statut = 'a-appeler' and diagnostic->>'resume' = 'Créée en 2014';
  r := r || 'nouveau avec numero du jour et diagnostic : ' || n || ' ; ';
  select count(*) into n from public.fiches_prospection where siren = '111111111' and telephone is null; r := r || 'refuse sans numero : ' || n || ' ; ';
  select count(*) into n from public.fiches_prospection where siren = '222222222' and telephone = '06 39 98 00 22' and statut = 'a-rappeler' and notes = 'Après 10 h' and angle = 'Nouvel angle';
  r := r || 'rappel du jour : numero, statut et notes gardes : ' || n || ' ; ';
  select count(*) into n from public.fiches_prospection where siren = '333333333' and telephone is null; r := r || 'rappel plus tard sans numero : ' || n || ' ; ';
  select count(*) into n from public.fiches_prospection where siren = '555555555'; r := r || 'numero faux ecarte : ' || case when n = 0 then 'oui' else 'NON (FAUTE)' end || ' ; ';

  insert into auth.users (id, instance_id, aud, role, email) values (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vf@essai.invalid');
  insert into public.prospecteurs (user_id) values (ua);
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform prive.verser_fiches('[]'::jsonb, j); r := r || 'l app appelle le versement : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'l app appelle le versement : refuse ; '; end;
  reset role;
  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
