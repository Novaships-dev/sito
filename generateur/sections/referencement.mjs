// Le référencement d'un site (tâche T51, constat S-003, spécification
// docs/specs/S-REFERENCEMENT.md).
//
// Deux régimes, jamais mélangés (§1) :
//   prospection : <meta name="robots" content="noindex, nofollow">, aucune
//                 donnée structurée, pas de robots.txt ni de plan du site ici
//                 (la publication privée pose les siens : scripts/prospection) ;
//   abonné      : pas de noindex, données structurées JSON-LD, robots.txt qui
//                 autorise, plan du site.
// Les deux ont un aperçu de partage (Open Graph) et une icône.
//
// L'adresse publique (`--adresse https://hote/`) vient de la table `adresses`.
// Sans elle, rien d'absolu ne s'écrit : ni URL canonique, ni og:url, ni plan
// du site. On n'invente pas une adresse ; la page le dit dans une balise
// (`atelier-adresse` = aucune) et `verifier-site` le signale.
//
// Rien d'inventé dans le JSON-LD : pas de note ni d'avis sur soi-même (Google
// ne les accepte pas pour ce cas), pas de prix, pas d'horaires tant que
// l'artisan ne les a pas donnés. Échappement : jsonDansPage (T48).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { html as ech, jsonDansPage } from '../echapper.mjs';

export const OG_IMAGE = 'images/partage.jpg';

// L'adresse publique, normalisée : https, minuscules, une barre finale.
export function adressePublique(brute) {
  if (!brute) return null;
  let u;
  try { u = new URL(String(brute)); } catch { throw new Error('adresse publique invalide : ' + brute); }
  if (u.protocol !== 'https:' || u.search || u.hash) throw new Error('adresse publique invalide (https, sans paramètre) : ' + brute);
  return `https://${u.host.toLowerCase()}${u.pathname.endsWith('/') ? u.pathname : u.pathname + '/'}`;
}

// L'adresse d'une page, sans « .html » (le Worker sert « /le-travail »).
export const urlPage = (adresse, fichier) =>
  adresse ? adresse + (fichier === 'index.html' ? '' : fichier.replace(/\.html$/, '')) : null;

// Les données structurées de l'accueil (§3).
export function donneesStructurees({ e, base, tel, adresse }) {
  if (!e.adresse || !e.codePostal || !e.commune) throw new Error('données structurées : adresse incomplète (rue, code postal, commune)');
  const d = {
    '@context': 'https://schema.org',
    '@type': base.schemaType || 'HomeAndConstructionBusiness',
    name: e.nomLisible || e.denomination,
    address: { '@type': 'PostalAddress', streetAddress: e.adresse, postalCode: e.codePostal, addressLocality: e.commune, addressCountry: 'FR' },
    areaServed: e.commune,
  };
  if (tel) d.telephone = tel.lien.replace(/^tel:/, '');
  if (adresse) { d.url = adresse; d.image = adresse + OG_IMAGE; }
  if (e.siret) d.identifier = { '@type': 'PropertyValue', propertyID: 'SIRET', value: e.siret };
  return d;
}

// Ce que l'en-tête de chaque page reçoit, régime compris.
export function tete({ abonne, adresse, fichier, titre, description, e, base, tel }) {
  const url = urlPage(adresse, fichier);
  const image = adresse ? adresse + OG_IMAGE : OG_IMAGE;
  const l = [
    abonne ? '' : '<meta name="robots" content="noindex, nofollow">',
    `<meta name="atelier-adresse" content="${adresse ? ech(adresse) : 'aucune'}">`,
    url ? `<link rel="canonical" href="${ech(url)}">` : '',
    '<link rel="icon" href="favicon.ico" sizes="32x32">',
    '<link rel="icon" href="icone.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="icone-180.png">',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="fr_FR">',
    `<meta property="og:title" content="${ech(titre)}">`,
    `<meta property="og:description" content="${ech(description)}">`,
    `<meta property="og:image" content="${ech(image)}">`,
    url ? `<meta property="og:url" content="${ech(url)}">` : '',
    abonne && fichier === 'index.html'
      ? `<script type="application/ld+json">${jsonDansPage(donneesStructurees({ e, base, tel, adresse }))}</script>` : '',
  ];
  return l.filter(Boolean).join('\n');
}

// L'image de partage : 1 200 × 630, JPEG, tirée de la photo d'ouverture.
export async function imagePartage(source, sortie) {
  await sharp(source).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true })
    .toFile(join(sortie, OG_IMAGE));
}

// L'icône : l'initiale de l'enseigne sur la couleur de la charte (R7). Jamais
// un logo inventé pour l'entreprise.
export async function icones({ sortie, initiale, fond, encre }) {
  const lettre = ech((initiale || '?').toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${fond}"/><text x="32" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="${encre}">${lettre}</text></svg>`;
  writeFileSync(join(sortie, 'icone.svg'), svg);
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(join(sortie, 'icone-180.png'));
  // favicon.ico : un conteneur ICO qui porte une image PNG de 32 px.
  const png = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer();
  const entete = Buffer.alloc(22);
  entete.writeUInt16LE(0, 0); entete.writeUInt16LE(1, 2); entete.writeUInt16LE(1, 4);
  entete.writeUInt8(32, 6); entete.writeUInt8(32, 7); entete.writeUInt8(0, 8); entete.writeUInt8(0, 9);
  entete.writeUInt16LE(1, 10); entete.writeUInt16LE(32, 12); entete.writeUInt32LE(png.length, 14); entete.writeUInt32LE(22, 18);
  writeFileSync(join(sortie, 'favicon.ico'), Buffer.concat([entete, png]));
}

// robots.txt et sitemap.xml d'un site d'abonné (RS1, RS2).
export function fichiersSite({ sortie, adresse, pages, jour }) {
  writeFileSync(join(sortie, 'robots.txt'), `User-agent: *\nAllow: /\n${adresse ? `Sitemap: ${adresse}sitemap.xml\n` : ''}`);
  if (!adresse) return;
  const urls = pages.map((f) => `  <url><loc>${ech(urlPage(adresse, f))}</loc><lastmod>${jour}</lastmod></url>`).join('\n');
  writeFileSync(join(sortie, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}
