// La mesure d'audience d'un site d'abonné (T22) : Umami, un site Umami par
// artisan (TRD §7 ; CNIL, docs/CONSTRAINTS.md C40). Le script compte les
// visites ; l'attribut `data-umami-event="Appeler"` sur chaque lien
// téléphonique compte les touches « Appeler » (le script d'Umami suit les
// clics sur tout élément qui porte cet attribut).
//
// Seulement sur un site d'abonné, et seulement si son identifiant Umami est
// donné (`--umami-id`, lu dans `sites.umami_id`) : un site de prospection ne
// mesure rien. Sans cookie : Umami n'en dépose pas ; `data-do-not-track`
// respecte le réglage « ne pas me suivre » du navigateur.
//
// L'adresse du script vient de `--umami-script` ; par défaut celle d'Umami
// Cloud. À vérifier avec le compte (action F9) : si Umami est hébergé
// ailleurs, c'est là que le script se trouve.
import { html as ech } from '../echapper.mjs';

export const SCRIPT_PAR_DEFAUT = 'https://cloud.umami.is/script.js';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Rend null si la page ne mesure rien.
export function reglage({ abonne, id, script }) {
  if (!abonne || !id) return null;
  if (!UUID.test(id)) throw new Error(`mesure : identifiant Umami invalide (${id})`);
  const src = script || SCRIPT_PAR_DEFAUT;
  if (!/^https:\/\/[^\s"'<>]+$/.test(src)) throw new Error('mesure : adresse du script en https attendue');
  return { id, src };
}

export function balise(r) {
  if (!r) return '';
  return `<script defer src="${ech(r.src)}" data-website-id="${ech(r.id)}" data-do-not-track="true"></script>`;
}

// Chaque lien téléphonique compte comme « Appeler ». Les liens portent tous
// `data-appel="numero"` (sections/appel.mjs) : une seule marque à poser.
export function marquerAppels(html, r) {
  if (!r) return html;
  return html.replace(/data-appel="numero"/g, 'data-appel="numero" data-umami-event="Appeler"');
}

// La phrase des mentions légales (ML12) : ce que le site dépose et mesure.
export function mention(r) {
  if (!r) return 'Ce site ne dépose aucun cookie ni aucun traceur.';
  return 'Ce site ne dépose aucun cookie. Il compte ses visites et les touches « Appeler » avec l’outil de mesure Umami, sans cookie et sans vous suivre sur d’autres sites, pour la seule information de l’entreprise. Si votre navigateur demande à ne pas être suivi, rien n’est compté.';
}
