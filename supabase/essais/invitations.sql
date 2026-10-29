-- Essai de la table public.invitations et de public.creer_invitation
-- (migration invitations). Même principe que droits.sql : tout est annulé à
-- la fin par une erreur qui porte le résultat. Aucune ligne « FAUTE » attendue.
--
-- Résultat attendu :
--   jeton : 64 car. hex ; genre inscription, 14 jours ; reprise sans compte :
--   refusee ; anonyme lit : refuse ; connecte lit : refuse ; anonyme cree :
--   refuse ; jeton fabrique a la main : refuse

do $$
declare r text := ''; j text; n int; e timestamptz;
begin
  insert into public.entreprises (siren, denomination, nom_affiche, commune, code_postal, departement)
  values ('000000000', 'ESSAI SITO', 'Essai Sitô', 'Marseille', '13001', '13') on conflict (siren) do nothing;

  j := public.creer_invitation('000000000');
  r := r || 'jeton : ' || char_length(j) || ' car. ' || case when j ~ '^[0-9a-f]{64}$' then 'hex' else 'PAS HEX (FAUTE)' end || ' ; ';
  select count(*), max(expire_le) into n, e from public.invitations where jeton = j and genre = 'inscription' and utilisee_le is null;
  r := r || 'genre inscription, ' || round(extract(epoch from e - now()) / 86400) || ' jours'
    || case when n = 1 and round(extract(epoch from e - now()) / 86400) = 14 then '' else ' (FAUTE)' end || ' ; ';

  begin
    perform public.creer_invitation('000000000', 'reprise');
    r := r || 'reprise sans compte : ACCEPTEE (FAUTE) ; ';
  exception when others then r := r || 'reprise sans compte : refusee ; '; end;

  set local role anon;
  begin select count(*) into n from public.invitations; r := r || 'anonyme lit : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'anonyme lit : refuse ; '; end;
  begin perform public.creer_invitation('000000000'); r := r || 'anonyme cree : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'anonyme cree : refuse ; '; end;
  reset role;

  set local role authenticated;
  begin select count(*) into n from public.invitations; r := r || 'connecte lit : ACCEPTE (FAUTE) ; ';
  exception when others then r := r || 'connecte lit : refuse ; '; end;
  reset role;

  begin
    insert into public.invitations (jeton, siren) values ('123456', '000000000');
    r := r || 'jeton fabrique a la main : ACCEPTE (FAUTE)';
  exception when others then r := r || 'jeton fabrique a la main : refuse'; end;

  raise exception 'RESULTAT (tout est annule) : %', r;
end $$;
