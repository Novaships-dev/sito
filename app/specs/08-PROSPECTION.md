# 08 — Prospection : la chaîne qui prépare les appels de Fabrice

Version du 24 octobre 2026. Décisions de Fabrice du 23 octobre (`memoire/decisions.md`).
Le plan commercial, le script d'appel et les objections sont dans le document
Claude « Prospection Sitô : plan, script et objections » ; ici, seulement ce que
Claude Code construit.

## Ce que Fabrice doit trouver chaque matin à 7 h

Une page privée, faite pour son iPhone : la **page d'appels du jour**.
- 30 artisans, 10 par métier (ravalement de façade, couverture et zinguerie,
  peinture), Bouches-du-Rhône, triés par note.
- Pour chacun : nom, commune, métier, note et pourquoi, le lien de son site
  Sitô déjà en ligne, un bouton « Fiche Google » (ouvre la recherche Google Maps
  « nom + commune » : Fabrice y voit la fiche et appelle depuis elle), le SMS
  du lien prêt à copier (texte du document, section Messages), et des boutons
  de résultat en un appui : pas de réponse, rappeler (jour + heure),
  intéressé, essai lancé, abonné mois, abonné année, pas intéressé, ne plus appeler.
- En haut : les relances du jour (rappels promis, ouvreurs à 48 h) avant les
  nouveaux.
- Le point chiffré de la semaine : appels, conversations, liens ouverts,
  essais, abonnements (les objectifs sont dans le document).

## Les pièces

| Pièce | Rôle |
|---|---|
| `scripts/prospection/extraire.mjs` | API publique `recherche-entreprises.api.gouv.fr` (sans clé) : codes APE du métier, `departement=13`, **`etat_administratif=A` obligatoire**, effectif 0 à 10, créée il y a plus de 2 ans. Pièges : l'API ignore en silence un paramètre mal écrit (vérifier que le nombre de résultats bouge), `total_results` plafonne à 10 000 |
| `scripts/prospection/qualifier.mjs` | note de 0 à 100 : RGE (base publique ADEME) +, ancienneté +, site existant récent chez un prestataire = écarté. La présence d'un site se vérifie par une recherche web faite par Claude Code au moment de préparer le lot (`/preparer-appels`), notée dans la liste. **Jamais** de lecture automatisée de Google (conditions d'utilisation) ni de copie de ses photos |
| `prospection/registre.json` (versionné, sans numéro de téléphone) | chaque artisan déjà traité : SIREN, métier, date du site, slug, statut, relance. Un artisan n'est jamais rappelé deux fois le même jour, jamais après « ne plus appeler » |
| `scripts/prospection/fabriquer-lot.mjs` | 10 sites par métier pour les mieux notés, avec le générateur (`fabriquer-demo` en mode prospection : photos d'illustration, mention visible), contrôlés par `verifier-site`, `verifier-mobile`, unicité au département |
| `scripts/prospection/publier.mjs` | Cloudflare Pages, offre gratuite, **un seul projet** `sito-demo` : chaque site sous un slug aléatoire de 16 caractères ; images communes partagées une fois ; `_headers` avec `X-Robots-Tag: noindex` partout ; `robots.txt` qui interdit tout ; aucune page d'index ; retrait des sites non signés après 30 jours. Jeton dans `.env` (`CLOUDFLARE_COMPTE_ID`, `CLOUDFLARE_JETON_API`), lu par `scripts/env.mjs` |
| page d'appels + ses résultats | servie par le même projet sous un slug privé ; les résultats sont enregistrés par une fonction Pages dans un espace KV gratuit, et relus le soir pour la liste du lendemain |
| `.claude/skills/preparer-appels/SKILL.md` + `lanceurs/PREPARER_APPELS.bat` | la préparation du lot, de bout en bout, lancée d'un double-clic le soir (ou par `/preparer-appels`) |
| `lanceurs/CLE_CLOUDFLARE.bat` | comme `CLE_SUPABASE.bat` : ouvre la page des jetons Cloudflare, Fabrice colle, le script range dans `.env` et vérifie le jeton |

## Les images des deux nouveaux métiers

`banque/prompts/couverture.md` et `banque/prompts/peinture.md`, sur le modèle de
`banque/prompts/ravalement.md` : le bloc de règles à coller une fois, puis un
texte par image avec son nom de fichier, d'après `banque/liste-images.csv`.
**32 images par métier pour démarrer** (2 hero, 3 paires, 3 chantier, 5 geste,
8 matière dont le détail principal, 5 ambiance, 3 signes), 54 ensuite. Fabrice
les génère dans ChatGPT et les range dans `images/<métier>/` ; un script les
vérifie (nom, taille ≥ 1600 px, paires alignées) avant toute fabrication.

Les textes des sites de ces deux métiers (`generateur/metiers/<métier>.json`,
au volume du ravalement) passent avant les 13 autres métiers de T32.

## Cadre légal (rappel, non négociable)

Numéro appelé = celui de la fiche publique de l'entreprise, ouvert par Fabrice
depuis la page d'appels ; aucun numéro stocké. Sites montrés privés, invisibles
sur Google, sans photo de l'artisan prise ailleurs. « Ne plus appeler » =
retrait du site le jour même.

## Preuves

- extraction et qualification : essai sur une réponse d'API enregistrée (pas
  de réseau dans l'essai), un paramètre faux doit faire rougir ;
- publication : essai sur un faux Cloudflare local (comme `essai-publication`) :
  slugs non devinables, `noindex` présent sur chaque page, aucun index, retrait
  à 30 jours ;
- page d'appels : `essai-app`-like sur iPhone 390 px : boutons, résultat
  enregistré puis relu ;
- tout s'ajoute à `node scripts/essais.mjs`.
