# Sitô

Le générateur de sites pour artisans du bâtiment, et l'app de l'artisan.

À partir d'un numéro SIREN, Sitô fabrique un site complet pour une entreprise,
différent de celui de tous ses concurrents de la même ville. L'artisan reçoit
son site avant d'avoir parlé à qui que ce soit. S'il s'abonne, l'app lui montre
ses statistiques, ses avis et sa fiche Google, et il y ajoute les photos de ses
chantiers : le site s'enrichit tout seul.

**Où on en est :** `memoire/maintenant.md`. À lire en premier.

---

## Ce qu'il y a dans ce dépôt

| Dossier | Contenu |
|---|---|
| `memoire/` | **l'état du projet** : où on en est, les décisions de Fabrice, les pièges déjà rencontrés, le journal |
| `generateur/` | le moteur qui fabrique les sites. Voir `generateur/LISEZMOI.md` |
| `scripts/` | les cinq vérificateurs, et les outils autour |
| `rules/` | les règles que chaque site doit tenir : composition, mouvement, photos, client, design interdit… |
| `banque/` | la liste des 864 images à produire (54 par métier) et les prompts ChatGPT |
| `donnees/` | les données Sirene des entreprises de démonstration |
| `app/` | l'app de l'artisan : ce qu'elle doit faire. Pas encore de code |
| `supabase/` | la base : migrations, essai des droits. Voir `supabase/README.md` |
| `skills/` | les procédures de l'agent : rédaction, audit de design, prospection Sirene, veille |
| `docs/` | le cahier des charges (non validé), l'étude Framer, l'historique |
| `lanceurs/` | les fichiers à double-cliquer sous Windows |

Ce qui **n'est pas** dans Git, et pourquoi :

| Dossier | Raison |
|---|---|
| `images/` | trop lourd, et pas de Git LFS (décision de Fabrice). Voir `banque/README.md` |
| `sites/` | les sites fabriqués : ils se refabriquent depuis le dépôt |

## Faire tourner

Une fois, pour installer :

    npm install

Refabriquer les trois sites de démonstration et les vérifier :

    node scripts/fabriquer-demo.mjs            les cinq vérificateurs, quelques minutes
    node scripts/fabriquer-demo.mjs --rapide   le plancher et l'unicité seulement

Sous Windows, `lanceurs/FABRIQUER_DEMO.bat` fait la même chose.

## Les vérificateurs

Un site n'est fini que si les cinq sont à zéro.

| Script | Ce qu'il vérifie |
|---|---|
| `verifier-depot.mjs` | aucune pièce ne manque au dépôt |
| `verifier-site.mjs` | le plancher de la page : contraste, polices, poids, textes, photos marquées… |
| `verifier-ordinateur.mjs` | la page à la souris et au clavier, dans un vrai navigateur |
| `verifier-mobile.mjs` | la page au doigt, sur trois tailles de téléphone |
| `verifier-unicite.mjs` | deux sites voisins, même commune ou même département, ne se ressemblent pas |

Chaque contrôle a été essayé au moins une fois sur une page cassée exprès.

`capacite-unicite.mjs` n'est pas un vérificateur mais une mesure : combien de
sites d'un même métier le générateur sait rendre différents dans un
département. Résultat du 2 octobre 2026 : trois. Voir `memoire/maintenant.md`.

Sur une machine où Playwright n'a pas téléchargé son navigateur, la variable
`SITO_CHROMIUM` donne le chemin d'un Chromium déjà installé. Sous Windows,
Chrome suffit et rien n'est à régler.

## Le dépôt `atelier`

`Novaships-dev/Atelier` est l'outillage partagé entre les projets (règles,
skills, hooks). Le générateur y est né. Depuis le 2 octobre 2026, **tout ce qui
concerne Sitô vit ici**, y compris les règles web et les vérificateurs dans
leur dernière version.
