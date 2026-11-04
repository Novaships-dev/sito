#!/usr/bin/env node
// Un artisan accepte son site (tâche T59, docs/specs/S-MODELES.md, MO5 et MO6 ;
// décision de Fabrice du 4 nov. 2026 : « des qu'il y'en a un d'accepter il
// devient officiel », « chaque site accepter est différent »).
//
// Le modèle montré à l'artisan (noté au registre des appels par le lot du
// jour) passe « pris », à son SIREN : il ne sert plus jamais à personne. Un
// nouveau modèle, différent de tous ceux du métier, le remplace : 10 libres.
//
// MO6 : si ce modèle a déjà été pris par un autre artisan, le premier le
// garde ; celui-ci reçoit un autre modèle libre, et le bilan le dit : Fabrice
// lui remontre son site, refait sur ce modèle, avant de continuer.
//
// Accepter = l'artisan est passé « essai lancé » ou « abonné » dans la page
// d'appels. `--tous` traite toutes les fiches dans ce cas qui n'ont pas encore
// leur modèle ; la préparation du soir le lance avant de fabriquer le lot.
//
//   node scripts/prospection/accepter.mjs --siren 480423623
//   node scripts/prospection/accepter.mjs --tous
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import * as registreAppels from './registre.mjs';
import { lire as lireModeles, ecrire as ecrireModeles, completer } from './modeles.mjs';

export const ACCEPTE = ['essai-lance', 'abonne-mois', 'abonne-annee'];

const baseDu = (metier) => JSON.parse(readFileSync(join(RACINE, 'generateur', 'metiers', `${metier}.json`), 'utf8'));

// Rend { siren, modele, conflit, ajoutes } ; écrit le fichier des modèles et
// met à jour la fiche (le registre est écrit par l'appelant).
export function accepter(reg, siren, { jour, modeles: dossier, base = null } = {}) {
  const f = reg.fiches[siren];
  if (!f) throw new Error(`SIREN ${siren} absent du registre des appels`);
  if (!f.modele) throw new Error(`SIREN ${siren} : aucun modèle noté (site fabriqué avant les modèles ?)`);
  const etat = lireModeles(f.metier, dossier);
  const montre = etat.modeles.find((m) => m.id === f.modele);
  if (!montre) throw new Error(`modèle ${f.modele} introuvable pour « ${f.metier} »`);
  let garde = montre, conflit = null;
  if (montre.etat === 'pris' && montre.siren === siren) return { siren, modele: montre.id, conflit: null, ajoutes: [], deja: true };
  if (montre.etat === 'pris') {
    garde = etat.modeles.find((m) => m.etat === 'libre');
    if (!garde) throw new Error(`aucun modèle libre pour « ${f.metier} » : node scripts/prospection/modeles.mjs --metier ${f.metier}`);
    conflit = `le modèle ${montre.id} est déjà celui de ${montre.siren} : ${siren} reçoit ${garde.id}, son site est à refaire et à lui remontrer`;
  }
  garde.etat = 'pris'; garde.siren = siren; garde.pris_le = jour;
  const ajoutes = completer(etat, { base: base || baseDu(f.metier), jour });
  ecrireModeles(etat, dossier);
  f.modele = garde.id;
  f.modele_pris_le = jour;
  if (!ACCEPTE.includes(f.statut)) f.statut = 'essai-lance';
  return { siren, modele: garde.id, conflit, ajoutes: ajoutes.map((m) => m.id) };
}

// Toutes les fiches acceptées dont le modèle n'est pas encore réservé.
export function accepterTous(reg, opts = {}) {
  const faits = [];
  for (const [siren, f] of Object.entries(reg.fiches)) {
    if (!ACCEPTE.includes(f.statut) || !f.modele || f.modele_pris_le) continue;
    faits.push(accepter(reg, siren, opts));
  }
  return faits;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const val = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
  const appels = val('appels') || registreAppels.CHEMIN;
  const modeles = val('modeles') || undefined;
  const jour = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
  const reg = registreAppels.lire(appels);
  let faits;
  try {
    if (val('siren')) faits = [accepter(reg, val('siren'), { jour, modeles })];
    else if (process.argv.includes('--tous')) faits = accepterTous(reg, { jour, modeles });
    else { console.error('usage : accepter.mjs --siren <SIREN> | --tous [--appels <f>] [--modeles <dossier>]'); process.exit(2); }
  } catch (e) { console.error('Refus : ' + e.message); process.exit(2); }
  const fautes = registreAppels.valider(reg);
  if (fautes.length) { console.error('Registre refusé, rien n est écrit : ' + fautes.join(' ; ')); process.exit(1); }
  registreAppels.ecrire(reg, appels);
  for (const x of faits) console.log(`${x.siren} : modèle ${x.modele}${x.deja ? ' (déjà le sien)' : ''}${x.ajoutes.length ? `, nouveau modèle ${x.ajoutes.join(', ')}` : ''}${x.conflit ? `\n  ATTENTION : ${x.conflit}` : ''}`);
  if (!faits.length) console.log('aucune acceptation à enregistrer');
  if (!existsSync(appels)) process.exit(1);
}
