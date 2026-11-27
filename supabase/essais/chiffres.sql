-- Essai des droits de l'espace « Chiffres » (migration …_chiffres, T72).
-- Un prospecteur P et un artisan A fictifs ; tout est annulé à la fin.
-- Aucune ligne « FAUTE » attendue. Avant la migration : rouge (tables absentes).

do $$
declare r text := ''; n int; v uuid; e uuid; es uuid;
  up uuid := '00000000-0000-4000-8000-0000000000e0';
  ua uuid := '00000000-0000-4000-8000-0000000000e1';
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values (up, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pc@essai.invalid'),
         (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ac@essai.invalid');
  insert into public.prospecteurs (user_id) values (up);
  -- ce que Stripe écrira (clé de service)
  insert into public.encaissements (nom, formule, montant, source, stripe_ref) values ('Client Stripe', 'annuel', 720, 'stripe', 'pi_essai') returning id into es;

  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.encaissements; r := r || 'artisan voit ' || n || ' encaissement(s)' || case when n = 0 then '' else ' (FAUTE)' end || ' ; ';
  begin insert into public.ventes (nom, formule) values ('pirate', 'annuel'); r := r || 'artisan cree une vente : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'artisan cree une vente : refuse ; '; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', up, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.ventes (nom, formule) values ('Façades Essai', 'annuel') returning id into v;
  insert into public.encaissements (vente_id, nom, formule, montant) values (v, 'Façades Essai', 'annuel', 720) returning id into e;
  select count(*) into n from public.encaissements; r := r || 'prospecteur voit ' || n || ' encaissement(s) ; ';
  begin insert into public.encaissements (nom, formule, montant) values ('x', 'annuel', -5); r := r || 'montant negatif : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'montant negatif : refuse ; '; end;
  begin insert into public.encaissements (nom, formule, montant, source, stripe_ref) values ('x', 'annuel', 720, 'stripe', 'pi_faux'); r := r || 'faux paiement Stripe : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'faux paiement Stripe : refuse ; '; end;
  delete from public.encaissements where id = es; get diagnostics n = row_count;
  r := r || 'retire un paiement Stripe : ' || case when n = 0 then 'refuse' else 'ACCEPTE (FAUTE)' end || ' ; ';
  delete from public.encaissements where id = e; get diagnostics n = row_count;
  r := r || 'retire sa saisie : ' || n || ' ; ';
  update public.ventes set etat = 'terminee' where id = v; get diagnostics n = row_count;
  r := r || 'termine une vente : ' || n || ' ; ';
  reset role;

  set local role anon;
  begin select count(*) into n from public.encaissements; r := r || 'anonyme voit ' || n || ' (FAUTE) ; ';
  exception when others then r := r || 'anonyme : refuse ; '; end;
  reset role;

  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
