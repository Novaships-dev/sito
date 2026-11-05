// Chiffrer ce qui ne doit jamais être lisible en base (T24, X7 du TRD) : le
// jeton de rafraîchissement Google d'un artisan. Et signer l'« état » du
// parcours de consentement Google, pour qu'un retour de Google ne puisse pas
// relier une fiche à l'entreprise d'un autre.
//
// WebCrypto seulement : le même fichier tourne dans la fonction Edge (Deno) et
// dans le service (Node 22). Clé : `GOOGLE_CLE_CHIFFREMENT`, 32 octets en
// base64 (`openssl rand -base64 32`), dans les secrets, jamais dans le dépôt.
//
// Chiffré : AES-256-GCM, IV de 12 octets tiré au hasard à chaque fois, et le
// SIREN en donnée associée : un chiffré recopié sur la ligne d'une autre
// entreprise ne se déchiffre pas. Format (base64) : 0x01 | IV | chiffré+tag.

const enc = new TextEncoder(), dec = new TextDecoder();
const versB64 = (u8) => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); };
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const versB64url = (u8) => versB64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64url = (s) => deB64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

function cleBrute(cleB64) {
  let brut;
  try { brut = deB64(cleB64 || ''); } catch { brut = new Uint8Array(); }
  if (brut.length !== 32) throw new Error('clé de chiffrement : 32 octets en base64 attendus (GOOGLE_CLE_CHIFFREMENT)');
  return brut;
}

export async function chiffrer(texte, cleB64, contexte) {
  if (!contexte) throw new Error('chiffrer : contexte (SIREN) obligatoire');
  const cle = await crypto.subtle.importKey('raw', cleBrute(cleB64), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(contexte) }, cle, enc.encode(texte)));
  const out = new Uint8Array(1 + iv.length + ct.length);
  out[0] = 1; out.set(iv, 1); out.set(ct, 13);
  return versB64(out);
}

export async function dechiffrer(b64, cleB64, contexte) {
  const brut = deB64(b64);
  if (brut[0] !== 1 || brut.length < 13 + 16) throw new Error('chiffré illisible (version ou longueur)');
  const cle = await crypto.subtle.importKey('raw', cleBrute(cleB64), 'AES-GCM', false, ['decrypt']);
  try {
    const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: brut.slice(1, 13), additionalData: enc.encode(contexte) }, cle, brut.slice(13));
    return dec.decode(clair);
  } catch {
    throw new Error('déchiffrement refusé (clé, entreprise ou chiffré différents)');
  }
}

// La clé de signature est dérivée de la clé de chiffrement (empreinte
// SHA-256 avec une étiquette) : une seule clé à garder, deux usages séparés.
async function cleHmac(cleB64) {
  const tag = enc.encode('sito-etat-google:');
  const brut = cleBrute(cleB64);
  const tout = new Uint8Array(tag.length + brut.length); tout.set(tag); tout.set(brut, tag.length);
  const d = await crypto.subtle.digest('SHA-256', tout);
  return crypto.subtle.importKey('raw', d, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// { siren, user, retour } → jeton signé, valable `secondes`.
export async function signer(donnees, cleB64, { maintenant = Date.now(), secondes = 900 } = {}) {
  const corps = versB64url(enc.encode(JSON.stringify({ ...donnees, exp: Math.floor(maintenant / 1000) + secondes })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await cleHmac(cleB64), enc.encode(corps)));
  return `${corps}.${versB64url(sig)}`;
}

// Rend les données, ou null si la signature est fausse ou le jeton expiré.
export async function lireSigne(jeton, cleB64, { maintenant = Date.now() } = {}) {
  const [corps, sig] = String(jeton || '').split('.');
  if (!corps || !sig) return null;
  let bon = false;
  try { bon = await crypto.subtle.verify('HMAC', await cleHmac(cleB64), deB64url(sig), enc.encode(corps)); } catch { return null; }
  if (!bon) return null;
  let d;
  try { d = JSON.parse(dec.decode(deB64url(corps))); } catch { return null; }
  if (!d?.exp || d.exp * 1000 < maintenant) return null;
  return d;
}
