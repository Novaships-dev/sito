// Fabriquer un site depuis la base, au lieu de `donnees/` : lit entreprise,
// profil, tarifs et photos prêtes (atelier/supabase.mjs), construit ce que le
// générateur attend et l'appelle comme `scripts/prospection/fabriquer-lot.mjs`
// le fait déjà (sous-processus sur `generateur/composer.mjs`).
//
// app/specs/05-SCHEMA-BACKEND.md §3.6 : `sites.charte` est NN, « figée à la
// création ». Sans précaution, une refabrication (une photo de plus, par
// exemple) pourrait retirer la charte et changer l'apparence du site pour une
// raison qui ne regarde pas l'artisan : de nouveaux voisins, fabriqués entre
// temps, rendraient aujourd'hui un autre choix moins fautif
// (`generateur/tirage.mjs`). Ici : si `sites.archetype/charte` existe déjà
// pour ce SIREN et ce métier, on les relit et on les passe en `--charte` au
// générateur, qui ne les retire plus. Sinon, le générateur choisit, et cette
// fonction écrit son choix une seule fois.
//
// Les photos : `photos.role` ne connaît que avant, après, chantier, geste,
// detail (migration du 2 octobre) — pas de catégorie « hero » séparée, qui
// n'existe que dans la banque d'illustration de la prospection. Faute de
// mieux, le « hero » (la coupure avant/après du premier écran) reprend la
// photo « après » de la première paire. Choix d'ingénierie, à revoir une fois
// de vraies photos d'artisan essayées (T30) — noté dans le journal du 27 oct.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../scripts/env.mjs';
// Importé par chemin (via RACINE), pas par spécificateur relatif : un essai
// peut charger une copie cassée de ce fichier depuis un autre dossier, qui
// doit quand même retrouver le vrai generateur/charte.mjs du dépôt.
const { FAMILLES, POLICES, GEOMETRIES } = await import(pathToFileURL(join(RACINE, 'generateur', 'charte.mjs')).href);

export const ESPACE_PHOTOS = 'photos-chantiers';

// `sites.charte` garde le resume ecrit par le generateur dans donnees.json
// (famille/polices/geometrie en cle, pas les objets complets avec couleurs et
// fichiers de police) : plus court a lire dans le tableau de bord. Pour la
// redonner au generateur (--charte), on la reconstitue en entier.
export function charteComplete(resume) {
  const famille = FAMILLES.find((f) => f.cle === resume.famille);
  const polices = POLICES.find((p) => p.cle === resume.polices);
  const geo = GEOMETRIES.find((g) => g.cle === resume.geometrie);
  if (!famille || !polices || !geo) throw new Error(`charte illisible : famille=${resume.famille} polices=${resume.polices} geometrie=${resume.geometrie}`);
  return { famille, polices, geo, sol: resume.sol, mot: resume.mot,
    structure: resume.structure, teintes: resume.teintes, comparateur: resume.comparateur };
}

// Les tarifs de l'artisan dans la forme attendue par generateur/sections/prix.mjs.
export function tarifsDepuisBase(profil, tarifs) {
  if (!profil || profil.prix_affiches !== true) return { affiches: false };
  const postes = [...tarifs]
    .sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0))
    .map((t) => ({ poste: t.poste, bas: Number(t.bas), haut: t.haut == null ? null : Number(t.haut), unite: t.unite, note: t.note || '' }));
  return { affiches: true, postes, mention: profil.prix_mention || '' };
}

// Le fichier « brut » attendu par generateur/sirene.mjs (normaliser) : c'est
// la réponse Sirene brute, déjà gardée telle quelle dans entreprises.sirene
// (« réponse brute », 05-SCHEMA-BACKEND.md §3.2). On y ajoute ce que
// `sirene.mjs` ne lit pas ailleurs : le téléphone et les tarifs de l'artisan.
export function donneesDepuisBase(entreprise, profil, tarifs) {
  return {
    ...(entreprise.sirene || {}),
    siren: entreprise.siren,
    telephone: profil?.telephone || undefined,
    prix: tarifsDepuisBase(profil, tarifs || []),
  };
}

// Regroupe les photos prêtes d'une entreprise par rôle attendu du générateur
// (generateur/main-photos.mjs). `manquants` dit, en français, ce qui manque ;
// sans lui `roles` est utilisable.
export function rolesPhotosDepuisBase(photos) {
  const avant = photos.filter((p) => p.role === 'avant');
  const apres = photos.filter((p) => p.role === 'apres');
  const paires = [];
  const vues = new Set();
  for (const a of avant) {
    const cle = `${a.chantier_id}|${a.paire}`;
    if (vues.has(cle)) continue;
    const ap = apres.find((x) => x.chantier_id === a.chantier_id && x.paire === a.paire);
    if (ap) { vues.add(cle); paires.push([a, ap]); }
  }
  const chantiers = photos.filter((p) => p.role === 'chantier');
  const gestes = photos.filter((p) => p.role === 'geste');
  const details = photos.filter((p) => p.role === 'detail');

  const manquants = [];
  if (!paires.length) manquants.push('aucune paire avant/après complète (même chantier, même paire)');
  if (!chantiers.length) manquants.push('aucune photo de chantier (role=chantier)');
  if (!gestes.length) manquants.push('aucune photo de geste (role=geste)');
  if (!details.length) manquants.push('aucune photo de detail (role=detail)');
  if (manquants.length) return { roles: {}, manquants };

  const roles = {};
  paires.forEach(([a, ap], i) => {
    const n = String(i + 1).padStart(2, '0');
    roles[`avant-${n}`] = a.chemin;
    roles[`apres-${n}`] = ap.chemin;
  });
  roles.hero = paires[0][1].chemin;
  chantiers.forEach((p, i) => { roles[i === 0 ? 'chantier' : `chantier-${i + 1}`] = p.chemin; });
  gestes.forEach((p, i) => { roles[i === 0 ? 'geste' : `geste-${i + 1}`] = p.chemin; });
  details.forEach((p, i) => { roles[i === 0 ? 'detail-entreprise' : `detail-entreprise-${i + 1}`] = p.chemin; });
  return { roles, manquants: [] };
}

// Télécharge les photos (image propre, `photos.chemin`) vers un dossier de
// fichiers nommés par rôle, ce que `generateur/composer.mjs` attend.
export async function telechargerPhotos(sb, roles, dossier, { espace = ESPACE_PHOTOS } = {}) {
  mkdirSync(dossier, { recursive: true });
  const stockage = sb.stockage(espace);
  for (const [role, chemin] of Object.entries(roles)) {
    const ext = (chemin.match(/\.(jpe?g|png|webp|avif)$/i)?.[1] || 'jpg').toLowerCase();
    const octets = await stockage.lire(chemin);
    writeFileSync(join(dossier, `${role}.${ext}`), octets);
  }
}

// Fabrique un site pour (siren, métier) depuis la base, et écrit sa charte
// dans `sites` si c'est la première fois. Rend { ok: false, motif, manquants }
// sans rien écrire si les photos ne suffisent pas encore.
export async function fabriquerDepuisBase({
  sb, siren, metier, sortie, registre, espacePhotos = ESPACE_PHOTOS, dire = () => {},
}) {
  const entreprise = await sb.lireUne('entreprises', { filtres: { siren: ['eq', siren] } });
  if (!entreprise) return { ok: false, motif: `entreprise ${siren} introuvable` };
  const profil = await sb.lireUne('profils', { filtres: { siren: ['eq', siren] } });
  const tarifs = await sb.lire('tarifs', { filtres: { siren: ['eq', siren] } });
  const photos = await sb.lire('photos', { filtres: { siren: ['eq', siren], etat: ['eq', 'prete'] } });
  const siteExistant = await sb.lireUne('sites', { filtres: { siren: ['eq', siren], metier: ['eq', metier] } });

  const { roles, manquants } = rolesPhotosDepuisBase(photos);
  if (manquants.length) return { ok: false, motif: 'photos prêtes insuffisantes', manquants };

  const tmp = mkdtempSync(join(tmpdir(), 'sito-fabrication-'));
  try {
    const dossierImages = join(tmp, 'images');
    await telechargerPhotos(sb, roles, dossierImages, { espace: espacePhotos });

    const fichierDonnees = join(tmp, 'donnees.json');
    writeFileSync(fichierDonnees, JSON.stringify(donneesDepuisBase(entreprise, profil, tarifs), null, 2));

    let fichierCharte = null;
    if (siteExistant?.charte) {
      fichierCharte = join(tmp, 'charte.json');
      writeFileSync(fichierCharte, JSON.stringify({ archetype: siteExistant.archetype, charte: charteComplete(siteExistant.charte) }));
    }

    mkdirSync(sortie, { recursive: true });
    const args = [join(RACINE, 'generateur', 'composer.mjs'),
      '--siren', siren, '--metier', metier, '--images', dossierImages,
      '--sortie', sortie, '--donnees', fichierDonnees, '--registre', registre];
    if (fichierCharte) args.push('--charte', fichierCharte);
    const r = spawnSync(process.execPath, args, { cwd: RACINE, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const texteSortie = (r.stdout || '') + (r.stderr || '');
    dire(texteSortie);
    if (r.status !== 0) return { ok: false, motif: 'fabrication', sortie: texteSortie };

    const produit = JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8'));
    // Une ligne `sites` peut exister sans charte (inscrite avant sa première
    // fabrication) : elle reçoit la sienne ici, une seule fois.
    if (!siteExistant?.charte) {
      await sb.poser('sites', {
        siren, metier, archetype: produit.archetype, charte: produit.charte,
        titre: produit.titre, commune: entreprise.commune, departement: entreprise.departement,
      }, { surConflit: 'siren,metier' });
    }
    return { ok: true, sortie, archetype: produit.archetype, charte: produit.charte };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
