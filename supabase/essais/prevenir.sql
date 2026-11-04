-- Essai du déclencheur qui prévient GitHub (migrations 20261104044828_prevenir_github et 20261104044905_prevenir_github_correction,
-- T45). Tout est annulé à la fin par une erreur qui porte le résultat : aucun
-- appel ne part vraiment (pg_net n'envoie qu'après la validation). Aucune
-- ligne « FAUTE » attendue. Rejouer après toute migration qui y touche.
do $$
declare r text := ''; n0 int; n int; corps text; s uuid; t uuid;
begin
  insert into public.entreprises (siren, denomination, nom_affiche) values ('000000000', 'ESSAI PREVENIR', 'Essai prévenir')
    on conflict (siren) do nothing;
  select count(*) into n0 from net.http_request_queue;
  -- Sans jeton dans le coffre : aucun appel.
  if exists (select 1 from vault.decrypted_secrets where name = 'github_dispatch') then
    r := r || 'jeton déjà posé (F21) : essai sans jeton sauté ; ';
  else
    insert into public.profils (siren, telephone) values ('000000000', '0491234567')
      on conflict (siren) do update set telephone = excluded.telephone;
    select count(*) into n from net.http_request_queue;
    r := r || 'sans jeton, profil changé : ' || case when n = n0 then 'aucun appel' else 'APPEL (FAUTE)' end || ' ; ';
    s := vault.create_secret('jeton-d-essai', 'github_dispatch');
  end if;
  select count(*) into n0 from net.http_request_queue;
  update public.profils set telephone = '0491000000' where siren = '000000000';
  select count(*) into n from net.http_request_queue;
  select convert_from(body, 'utf8') into corps from net.http_request_queue order by id desc limit 1;
  r := r || 'avec jeton, profil changé : ' || case when n = n0 + 1 and corps like '%"siren": "000000000"%' and corps like '%refaire-site%' then '1 appel, SIREN et type justes' else 'FAUTE (' || (n - n0) || ' appel(s), ' || coalesce(left(corps, 80), 'rien') || ')' end || ' ; ';
  select count(*) into n0 from net.http_request_queue;
  insert into public.photos (siren, role, chemin_original, etat) values ('000000000', 'chantier', '000000000/x/a.jpg', 'recue');
  select count(*) into n from net.http_request_queue;
  r := r || 'photo reçue (pas prête) : ' || case when n = n0 then 'aucun appel' else 'APPEL (FAUTE)' end || ' ; ';
  update public.photos set etat = 'prete', chemin = '000000000/x/a.webp' where chemin_original = '000000000/x/a.jpg';
  select count(*) into n from net.http_request_queue;
  r := r || 'photo devenue prête : ' || case when n = n0 + 1 then '1 appel' else 'FAUTE (' || (n - n0) || ')' end || ' ; ';
  insert into public.tarifs (siren, poste, bas, unite) values ('000000000', 'Essai', 10, '€') returning id into t;
  select count(*) into n0 from net.http_request_queue;
  delete from public.tarifs where id = t;
  select count(*) into n from net.http_request_queue;
  r := r || 'tarif supprimé : ' || case when n = n0 + 1 then '1 appel' else 'FAUTE (' || (n - n0) || ')' end;
  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
