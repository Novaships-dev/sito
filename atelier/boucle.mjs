// La boucle du service : à chaque changement (photo prête, profil, tarifs,
// entreprise), refabriquer le site, le vérifier, le publier par version, et
// noter `fabrications` et `versions_site` (05-SCHEMA-BACKEND.md §3.6 à 3.8,
// §7 « Refabriquer et publier »).
//
// Pas de serveur loué (décision de Fabrice du 29 oct. 2026) : cette boucle
// est ce qu'un workflow GitHub Actions appellera (T45). Elle ne sait rien de
// qui la déclenche ; elle fait un tour et rend son bilan.
//
// Règles tenues ici, mesurées par `scripts/essai-boucle.mjs` :
//   - un site n'est refait que si quelque chose a changé depuis sa dernière
//     fabrication, réussie ou non : un site refusé n'est pas refait en boucle
//     tant que rien ne change ;
//   - une version refusée par le vérificateur ne remplace rien : ni le
//     stockage, ni les adresses, ni `sites.version`, ni `versions_site` ;
//   - une seule version `en_ligne` par site (index unique partiel de la base).
//
// Limite connue : un tarif **supprimé** ne laisse pas de date ; il se verra à
// la fabrication suivante. À reprendre si l'app permet de supprimer un tarif
// sans rien changer d'autre.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { RACINE } from '../scripts/env.mjs';
import { fabriquerDepuisBase } from './fabriquer.mjs';
import { publierVersion } from './publier.mjs';

const date = (x) => (x ? new Date(x).getTime() : 0);
const plusRecent = (lignes, champs = ['mis_a_jour_le', 'cree_le']) =>
  Math.max(0, ...lignes.map((l) => Math.max(...champs.map((c) => date(l?.[c])))));

// Le vérificateur réel : `scripts/verifier-site.mjs`, sortie 0 = aucun
// bloquant. Ses constats partent dans `fabrications.verifications`.
export function verifierSite(dossier) {
  const r = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), dossier, '--json'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  let constats = [];
  try { constats = JSON.parse(r.stdout).constats || []; } catch { constats = [{ gravite: 'bloquant', libelle: 'sortie du vérificateur illisible', detail: (r.stderr || '').slice(0, 300) }]; }
  const bloquants = constats.filter((c) => c.gravite === 'bloquant');
  return { ok: r.status === 0 && bloquants.length === 0, bloquants, constats };
}

// La date du dernier changement qui touche ce site, et celle de sa dernière
// fabrication. Rend { aRefaire, raison }.
export async function aRefaire(sb, site) {
  const f = { siren: ['eq', site.siren] };
  const [entreprise, profil, tarifs, photos, fabs] = await Promise.all([
    sb.lireUne('entreprises', { filtres: f }),
    sb.lireUne('profils', { filtres: f }),
    sb.lire('tarifs', { filtres: f }),
    sb.lire('photos', { filtres: { ...f, etat: ['eq', 'prete'] } }),
    sb.lire('fabrications', { filtres: { site_id: ['eq', site.id] } }),
  ]);
  const derniere = plusRecent(fabs, ['debut']);
  if (!derniere) return { aRefaire: true, raison: 'jamais fabriqué' };
  const quoi = [
    ['photos', plusRecent(photos)], ['profil', plusRecent([profil])],
    ['tarifs', plusRecent(tarifs)], ['entreprise', plusRecent([entreprise])],
  ].filter(([, t]) => t > derniere).map(([n]) => n);
  return quoi.length ? { aRefaire: true, raison: `changé : ${quoi.join(', ')}` } : { aRefaire: false, raison: 'rien de changé' };
}

// Refait un site et le publie. `maintenant` est passé pour les essais.
export async function refaireSite({
  sb, site, registre, stockage, adresses, hotes, verifier = verifierSite,
  maintenant = () => new Date(), dire = () => {},
  // `publier({ site, dossier, verifier })` : la publication. Par défaut le
  // stockage par versions (R2 et KV) ; GitHub Actions passe Cloudflare Pages
  // (atelier/publier-pages.mjs, T45), R2 demandant une carte bancaire.
  publier = null,
}) {
  const debut = maintenant().toISOString();
  const tmp = mkdtempSync(join(tmpdir(), 'sito-boucle-'));
  let fab = null;
  try {
    const sortie = join(tmp, 'site');
    const fait = await fabriquerDepuisBase({ sb, siren: site.siren, metier: site.metier, sortie, registre, dire });
    if (!fait.ok) {
      // Rien de fabriqué (photos insuffisantes) : on le note quand même, pour
      // ne pas retenter à chaque tour tant que rien ne change.
      await sb.inserer('fabrications', [{ site_id: site.id, version: (site.version || 0) + 1, images: 'entreprise', statut: 'erreur',
        verifications: { motif: fait.motif, manquants: fait.manquants || [] }, debut, fin: maintenant().toISOString() }]);
      return { publie: false, statut: 'erreur', motif: fait.motif, manquants: fait.manquants || [] };
    }
    [fab] = await sb.inserer('fabrications', [{ site_id: site.id, version: (site.version || 0) + 1, images: 'entreprise', statut: 'en_cours', debut }]);

    let verdict = null;
    const verifierEtGarder = async (d) => (verdict = await verifier(d));
    const pub = publier
      ? await publier({ site, dossier: sortie, verifier: verifierEtGarder })
      : await publierVersion({ site: site.id, dossier: sortie, stockage, adresses, hotes, verifier: verifierEtGarder });
    const fin = maintenant().toISOString();
    const verifications = { ok: Boolean(verdict?.ok), bloquants: verdict?.bloquants || [], constats: (verdict?.constats || []).length };

    if (!pub.publie) {
      await sb.majorer('fabrications', { id: ['eq', fab.id] }, { statut: 'refusee', verifications: { ...verifications, motif: pub.motif }, fin });
      dire(`site ${site.siren}/${site.metier} : refusé (${pub.motif}), la version en ligne ne bouge pas`);
      return { publie: false, statut: 'refusee', motif: pub.motif, bloquants: pub.bloquants };
    }

    await sb.majorer('fabrications', { id: ['eq', fab.id] }, { statut: 'reussie', version: pub.version, verifications, fin });
    await sb.majorer('versions_site', { site_id: ['eq', site.id], en_ligne: ['eq', 'true'] }, { en_ligne: false });
    await sb.inserer('versions_site', [{ site_id: site.id, numero: pub.version, fabrication_id: fab.id,
      fichiers: pub.fichiers, octets: pub.octets, en_ligne: true, publiee_le: fin }]);
    await sb.majorer('sites', { id: ['eq', site.id] }, { version: pub.version, publie_le: fin, adresse_en_ligne: (hotes && hotes[0]) || pub.url || null });
    dire(`site ${site.siren}/${site.metier} : version ${pub.version} en ligne (${pub.envoyes} envoyés, ${pub.recopies} recopiés)`);
    return { publie: true, statut: 'reussie', version: pub.version };
  } catch (e) {
    if (fab) await sb.majorer('fabrications', { id: ['eq', fab.id] }, { statut: 'erreur', verifications: { erreur: e.message }, fin: maintenant().toISOString() });
    throw e;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Un tour : chaque site de la base (ou ceux passés), refait s'il a changé.
// `hotesDe(site)` rend les adresses à faire pointer.
export async function tour({ sb, sites = null, hotesDe, dire = () => {}, ...reste }) {
  const liste = sites || await sb.lire('sites', {});
  const bilan = [];
  for (const site of liste) {
    const besoin = await aRefaire(sb, site);
    if (!besoin.aRefaire) { bilan.push({ site: site.id, saute: besoin.raison }); continue; }
    dire(`site ${site.siren}/${site.metier} : ${besoin.raison}`);
    const r = await refaireSite({ sb, site, hotes: hotesDe(site), dire, ...reste });
    bilan.push({ site: site.id, raison: besoin.raison, ...r });
  }
  return bilan;
}
