-- La vraie analyse de l'artisan avant l'appel, et le versement du soir depuis
-- le cloud (T73).
--
-- Décision du 27 nov. 2026 : « Il faut surtout que en plus des numero j'ai une
-- vrais analyse de l'artisan pour l'apelle ». Préparation du soir : « Je
-- préfére B oui et A pour les maquette » (B : une tâche programmée de Claude,
-- dans le cloud, chaque soir ; A : le PC de Fabrice pour les maquettes),
-- « Oui 21H c'est bon », « facadier en premier puis ensuite il y'aura un mix
-- tout les jour de différente branche ».
--
-- fiches_prospection.diagnostic (« analyse » est un mot réservé de PostgreSQL) : un objet JSON, lu tel quel par l'app :
--   resume      : qui est l'entreprise (ancienneté, taille, zone, spécialités)
--   presence    : [{ canal, etat ('bon' | 'moyen' | 'absent'), detail }]
--   clients     : ce que disent les avis (ce qui revient, en bien et en mal)
--   concurrents : qui sort devant lui sur Google pour son métier et sa ville
--   questions   : [texte] à poser pendant l'appel
--   objections  : [{ objection, reponse }]
--   proposition : ce qu'on lui propose, en une phrase, et pourquoi lui
-- prive.verser_fiches(fiches, jour) : les mêmes règles que
-- scripts/prospection/vers-espace.mjs, dans la base, pour la tâche du soir qui
-- n'a pas le fichier .env (elle passe par le connecteur Supabase). Réservée au
-- service : ni l'app ni le visiteur ne peuvent l'appeler.

alter table public.fiches_prospection
  add column diagnostic jsonb not null default '{}' check (jsonb_typeof(diagnostic) = 'object');

create function prive.verser_fiches(p_fiches jsonb, p_jour date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  f jsonb; v_siren text; v_tel text; v_deja record;
  v_crees int := 0; v_maj int := 0; v_num int := 0; v_ecartees jsonb := '[]';
begin
  if jsonb_typeof(p_fiches) <> 'array' then raise exception 'p_fiches doit être une liste'; end if;
  for f in select * from jsonb_array_elements(p_fiches) loop
    v_siren := f->>'siren';
    if v_siren is null or v_siren !~ '^[0-9]{9}$' or coalesce(trim(f->>'nom'), '') = '' then
      v_ecartees := v_ecartees || to_jsonb(coalesce(f->>'nom', '?') || ' : SIREN ou nom absent'); continue;
    end if;
    v_tel := nullif(regexp_replace(coalesce(f->>'telephone', ''), '[^0-9+]', '', 'g'), '');
    if v_tel is not null then
      v_tel := regexp_replace(v_tel, '^\+33', '0');
      if v_tel !~ '^0[1-9][0-9]{8}$' then v_ecartees := v_ecartees || to_jsonb((f->>'nom') || ' : numéro illisible'); continue; end if;
      v_tel := regexp_replace(v_tel, '([0-9]{2})(?=[0-9])', '\1 ', 'g');
    end if;
    select id, statut, a_appeler_le into v_deja from public.fiches_prospection where siren = v_siren;
    if found and v_deja.statut in ('refuse', 'ne-plus-appeler', 'abonne', 'essai-lance') then
      v_ecartees := v_ecartees || to_jsonb((f->>'nom') || ' : déjà « ' || v_deja.statut || ' », ne revient pas'); continue;
    end if;
    if found then
      update public.fiches_prospection set
        points_forts = coalesce(f->'points_forts', points_forts),
        points_faibles = coalesce(f->'points_faibles', points_faibles),
        diagnostic = coalesce(f->'diagnostic', diagnostic),
        angle = coalesce(left(f->>'angle', 400), angle),
        note_google = coalesce((f->>'note_google')::numeric, note_google),
        avis_google = coalesce((f->>'avis_google')::int, avis_google),
        site_actuel = coalesce(left(f->>'site_actuel', 200), site_actuel),
        lien_maquette = coalesce(nullif(f->>'lien_maquette', ''), lien_maquette),
        telephone = case when v_deja.a_appeler_le is not null and v_deja.a_appeler_le <= p_jour and v_tel is not null then v_tel else telephone end
      where id = v_deja.id;
      if v_deja.a_appeler_le is not null and v_deja.a_appeler_le <= p_jour and v_tel is not null then v_num := v_num + 1; end if;
      v_maj := v_maj + 1;
    else
      insert into public.fiches_prospection (siren, nom, metier, commune, telephone, statut, a_appeler_le, source,
        points_forts, points_faibles, diagnostic, angle, note_google, avis_google, site_actuel, lien_maquette)
      values (v_siren, left(trim(f->>'nom'), 160), coalesce(left(f->>'metier', 60), 'Autre'), left(f->>'commune', 80), v_tel,
        'a-appeler', p_jour, 'soiree', coalesce(f->'points_forts', '[]'), coalesce(f->'points_faibles', '[]'),
        coalesce(f->'diagnostic', '{}'), left(f->>'angle', 400), (f->>'note_google')::numeric, (f->>'avis_google')::int,
        left(f->>'site_actuel', 200), nullif(f->>'lien_maquette', ''));
      if v_tel is not null then v_num := v_num + 1; end if;
      v_crees := v_crees + 1;
    end if;
  end loop;
  return jsonb_build_object('jour', p_jour, 'crees', v_crees, 'mises_a_jour', v_maj, 'numeros', v_num, 'ecartees', v_ecartees);
end $$;
revoke all on function prive.verser_fiches(jsonb, date) from public, anon, authenticated;
grant execute on function prive.verser_fiches(jsonb, date) to service_role;
