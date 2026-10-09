---
name: sito-app
description: Règles pour coder l'app de l'artisan Sitô (app/, React, PWA). À utiliser dès qu'une tâche touche app/src, un écran, l'envoi des photos, la connexion, l'abonnement ou l'app Android.
---

# Coder l'app Sitô

## Où est quoi

`app/README.md` (carte des fichiers), `app/specs/02-TRD.md` §3 (organisation),
`app/specs/03-APPFLOW.md` (écrans), `app/specs/04-DESIGN-SYSTEM.md` (style).

## Règles

1. **Toutes les données passent par `Donnees`** (`app/src/types.ts`). Une
   fonction nouvelle s'ajoute dans cet ordre : l'interface, `donnees/demo.ts`,
   `donnees/supabase.ts`, l'essai. Un écran n'importe jamais `@supabase/supabase-js`.
2. **Les colonnes viennent de la vraie base.** Avant d'écrire une requête,
   vérifier les noms dans `app/specs/05-SCHEMA-BACKEND.md` ou avec l'outil MCP
   Supabase (`list_tables`). Le 9 octobre, `statistiques_jour` avait été
   inventé : la table s'appelle `statistiques`.
3. **Droits** : l'app n'écrit que les colonnes permises (05-SCHEMA §3). Une
   écriture refusée par la base est un défaut de l'app, pas de la base.
4. **Photos** : `app/src/photo.ts`. La nature d'un fichier se lit dans ses
   octets. Ce qui est lisible est réduit à 3 200 px, sans métadonnées ; le
   reste part tel quel ; l'original suit la version réduite.
5. **Android (Play Store)** : aucun prix, aucun lien d'achat (`android` dans le
   contexte). L'essai le vérifie.
6. **Textes** : français, vouvoiement, règles de `rules/common/redaction-fr.md`
   (pas de tiret cadratin, pas de point médian séparateur). Le contrôle
   `verifier-textes` lit `app/src/`.
7. **Accessibilité** : libellé visible sur chaque champ, cibles de 44 px,
   un seul `h1`, focus visible. Les tokens de couleur sont dans
   `app/src/style.css` ; un nouveau token s'ajoute d'abord dans 04-DESIGN-SYSTEM
   avec son contraste mesuré.
8. **Ce qui n'existe pas encore se dit à l'écran** (« arrive bientôt »), jamais
   un faux bouton ni un faux chiffre.

## Prouver

- `cd app && npm run build` (types stricts).
- `node scripts/essai-app.mjs` : ajouter les contrôles de la fonction
  nouvelle, mesurés sur le rendu ou sur le fichier réellement envoyé.
- Essayer une fois sur une copie cassée (`SITO_APP_DIST=<copie>/dist`).
- Contre la vraie base : l'essai de bout en bout (tâche T05) quand le `.env` existe.
