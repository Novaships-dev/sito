-- Essai du formulaire de demande (migration 20261104174705_deposer_demande, T10).
-- Les appels se font avec le rôle `anon`, celui d'un visiteur du site, et une
-- adresse IP posée dans `request.headers` comme le fait l'API de Supabase.
-- Tout est annulé à la fin par une erreur qui porte le résultat. Aucune ligne
-- « FAUTE » attendue. Rejouer après toute migration qui y touche.
do $$
declare
  r text := '';
  v text;
  n int;
  ip text := '{"x-forwarded-for": "203.0.113.7, 10.0.0.1"}';
begin
  insert into public.entreprises (siren, denomination, nom_affiche) values
    ('000000001', 'ESSAI ABONNE', 'Essai abonné'), ('000000002', 'ESSAI PROSPECT', 'Essai prospect')
    on conflict (siren) do nothing;
  insert into public.sites (siren, metier, archetype, charte, titre, statut) values
    ('000000001', 'ravalement', 'matiere', '{}', 'Essai', 'publie'),
    ('000000002', 'ravalement', 'matiere', '{}', 'Essai', 'prospection');

  perform set_config('request.headers', ip, true);
  execute 'set local role anon';

  v := public.deposer_demande('000000001', 'Bonjour, une façade de 120 m² à reprendre.', 'Jean Essai', '0491000000', null, '/le-travail');
  r := r || 'demande valide : ' || v || ' ; ';
  v := public.deposer_demande('000000001', 'Achetez', 'Robot', '0600000000', null, '/', 'rempli');
  r := r || 'robot : ' || v || ' ; ';
  v := public.deposer_demande('000000002', 'Bonjour', null, '0491000000');
  r := r || 'site de prospection : ' || v || ' ; ';
  v := public.deposer_demande('999999999', 'Bonjour', null, '0491000000');
  r := r || 'site inconnu : ' || v || ' ; ';
  v := public.deposer_demande('000000001', '   ', null, '0491000000');
  r := r || 'message vide : ' || v || ' ; ';
  v := public.deposer_demande('000000001', 'Bonjour');
  r := r || 'ni téléphone ni courriel : ' || v || ' ; ';
  v := public.deposer_demande('000000001', repeat('x', 4001), null, '0491000000');
  r := r || 'message trop long : ' || v || ' ; ';

  -- Huit de plus depuis la même adresse : 9 acceptées (avec la première), la
  -- 10e aussi, la 11e refusée.
  for i in 1..9 loop
    v := public.deposer_demande('000000001', 'Demande ' || i, null, null, 'a' || i || '@exemple.fr');
  end loop;
  r := r || '10e depuis la même adresse : ' || v || ' ; ';
  v := public.deposer_demande('000000001', 'Encore une', null, '0491000000');
  r := r || '11e depuis la même adresse : ' || v || ' ; ';
  -- Une autre adresse passe.
  perform set_config('request.headers', '{"cf-connecting-ip": "198.51.100.9"}', true);
  v := public.deposer_demande('000000001', 'Autre visiteur', null, '0491000000');
  r := r || 'autre adresse : ' || v || ' ; ';

  -- Le visiteur ne lit rien.
  begin
    perform 1 from public.demandes limit 1;
    r := r || 'lecture de demandes par anon : FAUTE (permise) ; ';
  exception when insufficient_privilege then
    r := r || 'lecture de demandes par anon : refusée ; ';
  end;
  begin
    perform 1 from prive.compteurs_demandes limit 1;
    r := r || 'lecture des compteurs par anon : FAUTE (permise) ; ';
  exception when insufficient_privilege then
    r := r || 'lecture des compteurs par anon : refusée ; ';
  end;

  execute 'reset role';
  select count(*) into n from public.demandes where siren = '000000001';
  r := r || 'demandes écrites : ' || n || case when n = 11 then '' else ' (FAUTE, 11 attendues)' end || ' ; ';
  select count(*) into n from public.demandes where siren = '000000002' or message = 'Achetez';
  r := r || 'demandes du robot et du prospect : ' || n || case when n = 0 then '' else ' (FAUTE)' end || ' ; ';
  select demandes into n from public.statistiques where siren = '000000001' and jour = prive.jour_paris(now()) and page = '/' and source = 'tout';
  r := r || 'statistiques.demandes du jour : ' || coalesce(n, 0) || case when n = 11 then '' else ' (FAUTE, 11 attendues)' end || ' ; ';
  select count(*) into n from prive.compteurs_demandes where cle like '%203.0.113.7%';
  r := r || 'adresse IP en clair dans les compteurs : ' || case when n = 0 then 'non' else 'FAUTE' end || ' ; ';
  select page into v from public.demandes where nom = 'Jean Essai';
  r := r || 'page notée : ' || coalesce(v, 'rien');
  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;

-- Deuxième partie : 50 demandes par site au plus (50 adresses différentes),
-- et contre-essai sur une copie temporaire (pg_temp) sans le champ piège, qui
-- doit écrire la demande du robot. Résultat du 4 nov. 2026 : « 50e : recue ;
-- 51e : trop ; écrites : 50 ; copie cassée : le robot est écrit ».
do $$
declare r text := ''; v text; n int; def text;
begin
  insert into public.entreprises (siren, denomination, nom_affiche) values ('000000001', 'ESSAI ABONNE', 'Essai abonné') on conflict (siren) do nothing;
  insert into public.sites (siren, metier, archetype, charte, titre, statut) values ('000000001', 'ravalement', 'matiere', '{}', 'Essai', 'publie');
  execute 'set local role anon';
  for i in 1..51 loop
    perform set_config('request.headers', json_build_object('cf-connecting-ip', '192.0.2.' || i)::text, true);
    v := public.deposer_demande('000000001', 'Demande ' || i, null, '0491000000');
    if i = 50 then r := r || '50e demande du site (50 adresses) : ' || v || ' ; '; end if;
  end loop;
  r := r || '51e demande du site : ' || v || ' ; ';
  execute 'reset role';
  select count(*) into n from public.demandes where siren = '000000001';
  r := r || 'écrites : ' || n || case when n = 50 then '' else ' (FAUTE, 50 attendues)' end || ' ; ';
  def := pg_get_functiondef('public.deposer_demande(text,text,text,text,text,text,text)'::regprocedure);
  def := replace(def, 'public.deposer_demande(', 'pg_temp.deposer_demande_casse(');
  def := replace(def, 'if coalesce(p_piege, '''') <> '''' then return ''recue''; end if;', '');
  execute def;
  perform set_config('request.headers', '{"cf-connecting-ip": "198.51.100.77"}', true);
  delete from public.demandes where siren = '000000001';
  v := pg_temp.deposer_demande_casse('000000001', 'Achetez', 'Robot', '0600000000', null, '/', 'rempli');
  select count(*) into n from public.demandes where message = 'Achetez';
  r := r || 'copie cassée (piège retiré) : ' || case when n = 1 then 'le robot est écrit, l essai rougirait : juste' else 'FAUTE, la cassure ne se voit pas' end;
  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
