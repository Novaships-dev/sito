# Contraintes : ce qui ne se discute pas dans une tâche

Écrit par Claude (Cowork) le 3 novembre 2026, sur le modèle du
`CONSTRAINTS.md` d'addyosmani/agent-skills relevé dans
`docs/historique/audit-repos.md` §24.3. Chaque contrainte est une **décision de
Fabrice** (date dans `memoire/decisions.md`) ou une **règle extérieure**
(source citée). Aucune ne vient de Claude. Une tâche qui heurte une contrainte
s'arrête et pose une question (`memoire/questions.md`) ; elle ne la contourne
pas.

## Produit

| N° | Contrainte | Source |
|---|---|---|
| C01 | Le cœur du produit est le site de l'artisan ; l'app sert à le faire vivre et à son référencement | décisions, sept. et 23 sept. 2026 |
| C02 | Chaque site diffère de ses voisins, dans la commune et dans le département ; 100 sites d'un même métier par département | décisions, 24 sept. et 2 oct. 2026 |
| C03 | Tous les métiers, à 100 % ; les quatre archétypes tous utilisés | décision, 23 sept. 2026 |
| C04 | Rien n'est inventé sur l'entreprise : les faits viennent de Sirene ; ce qui manque se dit sur la page | décision, sept. 2026 ; `rules/common/ne-pas-fabriquer.md` |
| C05 | Le téléphone vient de l'artisan, jamais d'une recherche ; sans lui, un emplacement désigné | décision, 2 oct. 2026 |
| C06 | Les prix sont ceux de l'artisan, affichés seulement s'il coche la case | décision, 2 oct. 2026 |
| C07 | Une image de la banque reste marquée « Exemple » jusqu'à ce que l'artisan mette les siennes ; aucune photo de l'artisan sur un site de prospection | décisions, sept. et 2 oct. 2026 |
| C08 | Toutes les photos de tous les appareils sont acceptées | décision, 3 oct. 2026 |
| C09 | Tout marche pareil sur iPhone et sur ordinateur | décision, sept. 2026 |
| C10 | Pas d'app sur le Play Store : l'app s'installe sur l'écran d'accueil depuis le site Sitô (iPhone, Android, ordinateur) | décision, 5 nov. 2026 (remplace celle du 5 oct.) |
| C11 | Fabrice crée chaque compte : identifiant = e-mail de l'artisan, mot de passe donné par lui ; pas d'inscription par l'artisan, pas de code | décision, 5 nov. 2026 (remplace celle du 29 oct.) |
| C12 | Réponses aux avis Google préparées, publiées seulement après validation de l'artisan | décision, 5 oct. 2026 |
| C13 | Ravalement : façadiers seulement | décision, 29 oct. 2026 |
| C14 | Artisans réels pour la prospection ; aucun numéro de téléphone dans le registre ni dans la page d'appels | décision, 24 oct. 2026 ; `worker/appels.js` |

## Argent

| N° | Contrainte | Source |
|---|---|---|
| C20 | Rien de payant n'est ouvert, acheté ou passé en mode réel sans Fabrice | `CLAUDE.md` §3 point 4 |
| C21 | Domaine, Cloudflare payant, Stripe, Google Play : attendre que l'app fonctionne | décision, 29 oct. 2026 |
| C22 | Pas de serveur loué : photos préparées dans l'app, sites refaits et publiés par GitHub Actions | décision, 29 oct. 2026 |
| C23 | Cloudflare R2 demande une carte bancaire : ne pas s'en servir ; Pages et KV gratuits | `app/specs/07-TACHES.md`, section « Sans serveur loué » |

## Dépôt et machine

| N° | Contrainte | Source |
|---|---|---|
| C30 | Pas de Git LFS ; les images vivent dans `images/` (hors Git) et dans le stockage | décision, sept. 2026 |
| C31 | Un dépôt dédié à Sitô ; tout ce qui concerne Sitô y vit | décision, 2 oct. 2026 |
| C32 | Ce qui est fini et en sécurité ailleurs (GitHub, Cloudflare) ne reste pas sur le PC ; sous 1 Go libre, plus de fabrication | décision, 29 oct. 2026 |
| C33 | Pas de doublons ; audit à chaque fin de séance | décision, 29 oct. 2026 |
| C34 | Claude Code travaille sans demander, dans les limites : 20 lancements par jour, 3 approches ou 45 minutes par panne, garde-fous verrouillés | décision, 10 oct. 2026 |
| C35 | Les documents écrits par Claude ne sont pas des décisions de Fabrice et ne se citent jamais comme telles | décision, sept. 2026 |

## Droit (règles extérieures)

| N° | Contrainte | Source |
|---|---|---|
| C40 | Mesure d'audience sans consentement : un site Umami par artisan, traceurs 13 mois, données 25 mois | CNIL, relevé dans `app/PLAN-APP.md` §7.4 |
| C41 | Domaine .fr au nom de l'artisan, avec son e-mail et son SIREN | charte Afnic, relevée dans `app/PLAN-APP.md` §4.2 |
| C42 | Facture électronique : réception depuis le 1er sept. 2026, émission PME au 1er sept. 2027 | relevé dans `app/PLAN-APP.md` §7.6 |
| C43 | Export et suppression de toutes les données de l'artisan | RGPD ; `app/specs/01-PRD.md` A17, A18 |
| C44 | Répondre aux avis Google au nom de l'artisan exige son autorisation | règle Google, relevée dans `app/PLAN-APP.md` §6.3 |
