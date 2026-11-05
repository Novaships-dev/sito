#!/usr/bin/env node
// Essai des comptes créés par Fabrice (nettoyage du 5 nov. 2026), sans réseau
// ni clé : `atelier/comptes.mjs` contre le faux Supabase (tables et Auth) et
// le faux annuaire des entreprises (population réelle enregistrée).
//
// Ce qu'il mesure :
//   - le mot de passe tiré : 12 caractères en trois groupes, sans 0/O/1/l/I,
//     jamais deux fois le même sur 2 000 tirages ;
//   - créer : l'entreprise lue dans l'annuaire est écrite (nom affiché sans
//     forme juridique, code APE, commune), le profil existe, le compte est
//     confirmé avec le mot de passe rendu, le lien `membres` est titulaire ;
//   - l'adresse est rangée en minuscules ; une entreprise déjà en base n'est
//     pas relue dans l'annuaire ;
//   - refus : adresse invalide, SIREN qui n'a pas neuf chiffres, SIREN absent
//     de l'annuaire, entreprise fermée, adresse qui a déjà un compte ; aucun
//     de ces refus ne laisse un compte derrière lui ;
//   - si le lien `membres` échoue, le compte créé est effacé ;
//   - nouveau mot de passe : posé sur le bon compte, différent de l'ancien ;
//     adresse inconnue refusée ;
//   - ce qui s'affiche dit l'identifiant et le mot de passe, rien d'autre de
//     secret (aucune clé).
//
//   node scripts/essai-comptes.mjs
//   node scripts/essai-comptes.mjs --contre-essai   (copies cassées)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { fauxRecherche } from './faux-recherche-entreprises.mjs';
import { supabase } from '../atelier/supabase.mjs';

const CLE = 'cle-de-test-comptes';
const POPULATION = JSON.parse(readFileSync(join(RACINE, 'prospection', 'essais', 'recherche-entreprises.json'), 'utf8')).entreprises;
const FERMEE = { ...POPULATION[1], siren: '999999990', etat_administratif: 'C' };

async function essayer(mod) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const refuse = async (promesse) => { try { await promesse; return null; } catch (e) { return e.message; } };

  console.log('Mot de passe');
  const tires = Array.from({ length: 2000 }, () => mod.motDePasse());
  ok(tires.every((m) => /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/.test(m)), 'trois groupes de quatre, sans caractère qu on confond', tires.find((m) => !/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/.test(m)));
  ok(new Set(tires).size === tires.length, '2 000 tirages, aucun en double');

  // Une entreprise avec une forme juridique dans le nom, pour voir le nom affiché.
  const cible = POPULATION.find((e) => /\b(SARL|SAS|SASU|EURL)\b/.test(e.nom_complet)) || POPULATION[0];
  const autre = POPULATION.find((e) => e.siren !== cible.siren);
  const fr = fauxRecherche([...POPULATION, FERMEE]);
  const fs = await fauxSupabase({
    cle: CLE,
    base: { entreprises: [], profils: [], membres: [] },
    cles: { entreprises: ['siren'], profils: ['siren'], membres: ['user_id', 'siren'] },
  });
  const sb = supabase({ url: fs.url, cle: CLE });
  try {
    console.log('Créer un compte');
    const r = await mod.creerCompte(sb, { courriel: '  Artisan.Test@Exemple.FR ', siren: cible.siren, fetch: fr });
    const ent = fs.base.entreprises.find((e) => e.siren === cible.siren);
    ok(Boolean(ent), 'l entreprise lue dans l annuaire est écrite');
    ok(ent && !/\b(SARL|SAS|SASU|EURL)\b/i.test(ent.nom_affiche) && ent.nom_affiche === r.entreprise, 'nom affiché sans forme juridique, et c est celui rendu', `${ent?.nom_affiche} / ${r.entreprise}`);
    ok(ent && ent.code_ape === cible.activite_principale && ent.commune === cible.siege.libelle_commune && ent.code_postal === cible.siege.code_postal, 'code APE, commune et code postal de l annuaire', JSON.stringify(ent && { a: ent.code_ape, c: ent.commune, p: ent.code_postal }));
    ok(fs.base.profils.some((p) => p.siren === cible.siren), 'le profil de l entreprise existe');
    const [id] = [...fs.comptes];
    const info = fs.infos.get(id);
    ok(info && info.email === 'artisan.test@exemple.fr' && r.courriel === 'artisan.test@exemple.fr', 'adresse rangée en minuscules, sans espace', info?.email);
    ok(info && info.confirme === true, 'compte déjà confirmé (aucun e-mail envoyé)');
    ok(info && info.password === r.motDePasse && /^[a-z2-9]{4}-/.test(r.motDePasse), 'le mot de passe posé est celui rendu');
    const m = fs.base.membres.find((l) => l.user_id === id);
    ok(m && m.siren === cible.siren && m.role === 'titulaire', 'lien membres : titulaire de cette entreprise', JSON.stringify(m));

    console.log('Entreprise déjà en base');
    const vuesAvant = fr.vues.length;
    fs.base.entreprises.push({ siren: autre.siren, denomination: 'DEJA LA', nom_affiche: 'Déjà là' });
    const r2 = await mod.creerCompte(sb, { courriel: 'deux@exemple.fr', siren: autre.siren, fetch: fr });
    ok(fr.vues.length === vuesAvant && r2.entreprise === 'Déjà là', 'pas relue dans l annuaire, la base fait foi', `${fr.vues.length - vuesAvant} appel(s)`);

    console.log('Refus');
    const n = fs.comptes.size;
    const e1 = await refuse(mod.creerCompte(sb, { courriel: 'pas-une-adresse', siren: cible.siren, fetch: fr }));
    ok(e1 && /adresse e-mail invalide/i.test(e1), 'adresse invalide', e1);
    const e2 = await refuse(mod.creerCompte(sb, { courriel: 'trois@exemple.fr', siren: '12345', fetch: fr }));
    ok(e2 && /neuf chiffres/.test(e2), 'SIREN qui n a pas neuf chiffres', e2);
    const e3 = await refuse(mod.creerCompte(sb, { courriel: 'trois@exemple.fr', siren: '111111118', fetch: fr }));
    ok(e3 && /introuvable/.test(e3), 'SIREN absent de l annuaire', e3);
    const e4 = await refuse(mod.creerCompte(sb, { courriel: 'trois@exemple.fr', siren: FERMEE.siren, fetch: fr }));
    ok(e4 && /fermée/.test(e4), 'entreprise fermée', e4);
    ok(!fs.base.entreprises.some((e) => e.siren === FERMEE.siren), 'l entreprise fermée n est pas écrite');
    const e5 = await refuse(mod.creerCompte(sb, { courriel: 'ARTISAN.test@exemple.fr', siren: cible.siren, fetch: fr }));
    ok(e5 && /déjà un compte/.test(e5), 'adresse qui a déjà un compte (casse ignorée)', e5);
    ok(fs.comptes.size === n, 'aucun refus ne laisse un compte', `${fs.comptes.size - n} de plus`);

    console.log('Lien membres en échec');
    const n2 = fs.comptes.size;
    const sbCasse = { ...sb, inserer: async () => { throw new Error('panne de la base (essai)'); } };
    const e6 = await refuse(mod.creerCompte(sbCasse, { courriel: 'quatre@exemple.fr', siren: cible.siren, fetch: fr }));
    ok(e6 && /panne/.test(e6) && fs.comptes.size === n2, 'le compte créé est effacé', `${e6} ; ${fs.comptes.size - n2} compte(s) restant(s)`);

    console.log('Nouveau mot de passe');
    const avant = fs.infos.get(id).password;
    const n3 = await mod.nouveauMotDePasse(sb, { courriel: 'Artisan.Test@exemple.fr' });
    ok(fs.infos.get(id).password === n3.motDePasse && n3.motDePasse !== avant, 'posé sur le bon compte, différent de l ancien');
    const autreId = [...fs.comptes].find((x) => x !== id);
    ok(fs.infos.get(autreId).password === r2.motDePasse, 'l autre compte n a pas bougé');
    const e7 = await refuse(mod.nouveauMotDePasse(sb, { courriel: 'inconnu@exemple.fr' }));
    ok(e7 && /aucun compte/i.test(e7), 'adresse inconnue refusée', e7);

    console.log('Ce qui s affiche');
    const texte = mod.aDonner(r, 'https://app.exemple.fr');
    ok(texte.includes('artisan.test@exemple.fr') && texte.includes(r.motDePasse) && texte.includes('https://app.exemple.fr'), 'adresse de l app, identifiant et mot de passe');
    ok(!texte.includes(CLE), 'aucune clé dans le texte');
    ok(fs.vues.every((v) => v.entetes.apikey === CLE && !v.entetes.authorization), 'la clé part dans apikey, jamais en Bearer');
  } finally { fs.arreter(); }
  return { fautes, essais };
}

const href = pathToFileURL(join(RACINE, 'atelier', 'comptes.mjs')).href;

if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await essayer(await import(href));
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const casses = [
    ['le lien membres n est pas titulaire', (s) => s.replace("role: 'titulaire' }]", "role: 'collaborateur' }]")],
    ['une entreprise fermée passe', (s) => s.replace("if (fiche.etat_administratif !== 'A') throw", "if (false) throw")],
    ['le compte reste si membres échoue', (s) => s.replace('    await sb.auth.supprimer(compte.id);\n', '')],
    ['l adresse garde ses majuscules', (s) => s.replace("const v = String(c || '').trim().toLowerCase();", "const v = String(c || '').trim();")],
    ['une adresse déjà prise n est pas vérifiée', (s) => s.replace('if (await sb.auth.chercher(c)) throw', 'if (false) throw')],
    ['mot de passe court et sans groupes', (s) => s.replace('return `${groupe()}-${groupe()}-${groupe()}`;', 'return groupe() + groupe();')],
    ['le nom affiché garde la forme juridique', (s) => s.replace('nom_affiche: nomAffiche(e),', 'nom_affiche: e.nom_complet,')],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-comptes-casse-'));
  let justes = 0;
  try {
    const fichier = 'atelier/comptes.mjs';
    const source = readFileSync(join(RACINE, fichier), 'utf8').replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from '${pathToFileURL(join(RACINE, fichier, '..', rel)).href}'`).replace(/import\('(\.\/[^']+)'\)/g, (_, rel) => `import('${pathToFileURL(join(RACINE, fichier, '..', rel)).href}')`);
    for (const [i, [quoi, casser]] of casses.entries()) {
      const cassee = casser(source);
      if (cassee === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.mjs`);
      writeFileSync(f, cassee);
      console.log(`\n--- copie cassée : ${quoi}`);
      const { fautes } = await essayer(await import(pathToFileURL(f).href));
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}
