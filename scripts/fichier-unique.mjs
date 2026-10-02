// Rassemble une page du generateur en un seul fichier .html : polices, images
// et feuilles de style deviennent des donnees en clair dans le document.
// Sert a envoyer une page par message, pour qu elle s ouvre sur un telephone
// sans serveur. Ce n est pas le format de publication, c est un format d essai.
//
//   node scripts/fichier-unique.mjs <dossier-du-site> [page.html] > sortie.html
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';

const dossier = process.argv[2];
const page = process.argv[3] || 'index.html';
if (!dossier) { console.error('usage: node scripts/fichier-unique.mjs <dossier> [page.html]'); process.exit(2); }

const types = { '.avif':'image/avif', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2' };

const cache = new Map();
function donnees(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const chemin = join(dossier, rel.split('?')[0]);
  if (!existsSync(chemin)) { console.error('absent, laisse tel quel : ' + rel); cache.set(rel, null); return null; }
  const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase().split('?')[0];
  const mime = types[ext] || 'application/octet-stream';
  const uri = 'data:' + mime + ';base64,' + readFileSync(chemin).toString('base64');
  cache.set(rel, uri);
  return uri;
}

let html = readFileSync(join(dossier, page), 'utf8');

// une seule source par image : la plus large du srcset, le reste part
html = html.replace(/\s+srcset="([^"]+)"/g, (t, liste) => {
  const cand = liste.split(',').map(s => s.trim().split(/\s+/)[0]);
  return cand.length ? ' data-source-unique="' + cand[cand.length - 1] + '"' : '';
});
html = html.replace(/\s+sizes="[^"]*"/g, '');
html = html.replace(/<img([^>]*?)data-source-unique="([^"]+)"([^>]*?)src="[^"]*"/g,
  (t, a, gros, b) => '<img' + a + b + 'src="' + gros + '"');
html = html.replace(/\s+data-source-unique="[^"]*"/g, '');

// chaque chemin relatif devient une donnee en clair
html = html.replace(/(src|href)="((?:images|polices)\/[^"]+)"/g,
  (t, att, rel) => { const d = donnees(rel); return d ? att + '="' + d + '"' : t; });
html = html.replace(/url\(\s*"?((?:images|polices)\/[^")]+)"?\s*\)/g,
  (t, rel) => { const d = donnees(rel); return d ? 'url("' + d + '")' : t; });

// La deuxieme page entre dans le fichier, sinon le lien du haut ne mene nulle
// part et le visiteur ne sait meme pas qu elle existe.
const seconde = join(dossier, 'le-travail.html');
if (existsSync(seconde)) {
  let p2 = readFileSync(seconde, 'utf8');
  p2 = p2.replace(/\s+srcset="([^"]+)"/g, (t, liste) => {
    const cand = liste.split(',').map(x => x.trim().split(/\s+/)[0]);
    return cand.length ? ' data-source-unique="' + cand[cand.length - 1] + '"' : '';
  });
  p2 = p2.replace(/\s+sizes="[^"]*"/g, '');
  p2 = p2.replace(/<img([^>]*?)data-source-unique="([^"]+)"([^>]*?)src="[^"]*"/g,
    (t, a, gros, b) => '<img' + a + b + 'src="' + gros + '"');
  p2 = p2.replace(/\s+data-source-unique="[^"]*"/g, '');
  p2 = p2.replace(/(src|href)="((?:images|polices)\/[^"]+)"/g,
    (t, att, rel) => { const d = donnees(rel); return d ? att + '="' + d + '"' : t; });
  const corps2 = (p2.match(/<main[^>]*>[\s\S]*?<\/main>/) || [''])[0]
    .replace(/<main([^>]*)id="[^"]*"/, '<main$1id="page-travail" hidden');
  const barre2 = (p2.match(/<div class="etat[^"]*"[\s\S]*?<\/div>\s*(?=<main|<section)/) || [''])[0];
  html = html.replace('</body>', corps2 + '\n</body>');
  html = html.replace(/<\/body>/, `<script>
(function(){
  var lien = document.querySelector('a[href="le-travail.html"], a[data-page="le-travail"]');
  var p1 = document.querySelector('main#principal'), p2 = document.getElementById('page-travail');
  if (!lien || !p1 || !p2) return;
  var retour = document.createElement('button');
  retour.type = 'button'; retour.className = 'jeton lien'; retour.textContent = 'Retour a l accueil';
  retour.style.cssText = 'position:fixed;left:16px;top:16px;z-index:60;cursor:pointer;background:#111;color:#eee;border:1px solid rgba(255,255,255,.2);border-radius:99px;padding:10px 16px';
  retour.style.display = 'none'; document.body.appendChild(retour);
  function montrer(deux){
    p1.hidden = deux; p2.hidden = !deux;
    retour.style.display = deux ? 'inline-flex' : 'none';
    window.scrollTo(0, 0);
  }
  lien.addEventListener('click', function(e){ e.preventDefault(); montrer(true); });
  retour.addEventListener('click', function(){ montrer(false); });
})();
</script>
</body>`);
}
html = html.replace(/href="(index)\.html"/g, 'href="#" data-page="$1"');

process.stdout.write(html);
