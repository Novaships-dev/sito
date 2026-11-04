// Le formulaire de demande d'un site d'abonné (T11, exigence S21).
//
// Il écrit par la fonction de la base `deposer_demande` (T10), appelée
// directement par l'API de Supabase avec la clé PUBLIQUE (`sb_publishable_…`,
// faite pour être dans une page). La base refait tous les contrôles : champ
// piège, longueurs, 10 demandes par jour et par adresse, 50 par site. Ce
// module ne fait que poser les champs et dire le résultat.
//
// Seulement sur un site d'abonné, et seulement si l'adresse de Supabase et la
// clé publique sont données (`--formulaire-url`, `--formulaire-cle`) : un site
// de prospection n'a pas de formulaire (la base le refuserait de toute façon).
//
// Le champ piège (`site_web`) est hors de l'écran, hors du clavier et caché
// aux lecteurs d'écran : un humain ne le remplit jamais, un robot souvent.
import { html as ech, jsonDansPage } from '../echapper.mjs';

export const TITRE = 'Laisser une demande';

// Rend '' si le formulaire n'a pas lieu d'être.
export function bloc({ abonne, url, cle, siren }) {
  if (!abonne || !url || !cle || !siren) return '';
  // Jamais une clé secrète dans une page : elle donnerait toute la base.
  if (!/^sb_publishable_/.test(cle)) throw new Error('formulaire : la clé doit être la clé publique (sb_publishable_…)');
  if (!/^https:\/\//.test(url) && !/^http:\/\/127\.0\.0\.1(:\d+)?\/?$/.test(url)) throw new Error('formulaire : adresse de Supabase en https attendue');
  return `<form class="formulaire" data-formulaire novalidate>
  <h3 class="moyen">${ech(TITRE)}</h3>
  <p class="note">L’entreprise vous rappelle ou vous répond par écrit. Laissez au moins un téléphone ou une adresse électronique.</p>
  <label>Votre nom <input name="nom" autocomplete="name" maxlength="120"></label>
  <label>Téléphone <input name="telephone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30"></label>
  <label>Adresse électronique <input name="courriel" type="email" autocomplete="email" maxlength="200"></label>
  <label>Votre demande <textarea name="message" rows="5" maxlength="4000" required></textarea></label>
  <div class="piege" aria-hidden="true"><label>Site web <input name="site_web" tabindex="-1" autocomplete="off"></label></div>
  <button class="appel envoyer" type="submit">Envoyer la demande</button>
  <p class="note retour" role="status" aria-live="polite"></p>
  <p class="note">Vos coordonnées vont à l’entreprise, et à elle seule. Voir les <a href="mentions-legales.html">mentions légales</a>.</p>
</form>
<script type="application/json" id="formulaire-reglages">${jsonDansPage({ url: url.replace(/\/$/, ''), cle, siren })}</script>`;
}

export function feuille() {
  return `
/* ---------------------------------------------------------------- formulaire */
.formulaire{display:grid;gap:.9rem;margin-top:clamp(24px,3vw,40px);max-width:36rem}
.formulaire label{display:grid;gap:.35rem;font-size:14px;font-weight:600;color:var(--t)}
.formulaire input,.formulaire textarea{font:inherit;font-weight:400;font-size:16px;color:var(--t);
  background:transparent;border:1px solid color-mix(in oklab, var(--t) 34%, transparent);
  border-radius:var(--rayon, 0);padding:12px 14px;min-height:48px;width:100%}
.formulaire textarea{resize:vertical;min-height:7.5rem}
.formulaire input:focus-visible,.formulaire textarea:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.formulaire .piege{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.formulaire .envoyer{justify-self:start;cursor:pointer;border:0}
.formulaire .envoyer[disabled]{opacity:.6;cursor:progress}
.formulaire .retour:empty{display:none}
.formulaire .retour{font-size:15px;color:var(--t)}
.formulaire .retour.erreur{color:var(--t)}
.formulaire .retour.erreur::before{content:"";display:inline-block;width:.6em;height:.6em;margin-right:.5em;background:var(--accent);border-radius:50%}
`;
}

// Le script, posé une fois par page. Sans formulaire, il ne fait rien.
export function script() {
  return `<script>
(function(){
  var f = document.querySelector('[data-formulaire]');
  var r = document.getElementById('formulaire-reglages');
  if (!f || !r) return;
  var reglages = JSON.parse(r.textContent);
  var retour = f.querySelector('.retour');
  var bouton = f.querySelector('.envoyer');
  var dire = function(texte, erreur){ retour.textContent = texte; retour.classList.toggle('erreur', !!erreur); };
  var MOTS = {
    recue: 'Demande envoyée. L’entreprise la voit dans son application.',
    trop: 'Trop de demandes envoyées aujourd’hui depuis cette connexion. Appelez l’entreprise, ou réessayez demain.',
    invalide: 'Écrivez votre demande et laissez un téléphone ou une adresse électronique.',
    inconnu: 'Ce site ne reçoit pas de demande pour l’instant. Appelez l’entreprise.'
  };
  f.addEventListener('submit', function(ev){
    ev.preventDefault();
    var v = function(n){ return (f.elements[n].value || '').trim(); };
    if (!v('message') || (!v('telephone') && !v('courriel'))) { dire(MOTS.invalide, true); return; }
    bouton.disabled = true; dire('Envoi…');
    fetch(reglages.url + '/rest/v1/rpc/deposer_demande', {
      method: 'POST',
      headers: { 'apikey': reglages.cle, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_siren: reglages.siren, p_message: v('message'), p_nom: v('nom') || null,
        p_telephone: v('telephone') || null, p_courriel: v('courriel') || null,
        p_page: location.pathname, p_piege: f.elements.site_web.value || null })
    }).then(function(res){ return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function(etat){
        dire(MOTS[etat] || MOTS.inconnu, etat !== 'recue');
        if (etat === 'recue') f.reset();
      })
      .catch(function(){ dire('L’envoi n’a pas marché. Vérifiez la connexion, ou appelez l’entreprise.', true); })
      .then(function(){ bouton.disabled = false; });
  });
})();
</script>`;
}
