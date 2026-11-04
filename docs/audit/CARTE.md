# Carte du dépôt

Générée par `node scripts/carte-depot.mjs --ecrire`. **Ne pas modifier à la main** : relancer le script.
`node scripts/carte-depot.mjs --verifier` sort 1 si cette carte n'est plus à jour.

Elle compte et classe, elle ne juge rien. Le jugement vit dans `docs/audit/REGISTRE.md`.
Un audit qui ne couvre pas toutes les zones le dit.

**377 fichiers suivis, dont 151 .md ; 92756 lignes de texte.** Hors zone : 0.

| Zone | Fichiers | Lignes de texte | Fichiers binaires |
|---|---|---|---|
| Z01 Pilotage de l agent | 27 | 2142 | 0 |
| Z02 Mémoire du projet | 11 | 2775 | 0 |
| Z03 Spécifications | 11 | 2394 | 0 |
| Z04 Documentation de travail | 24 | 3304 | 0 |
| Z05 Archives (ne pas lire pour une tâche) | 64 | 16361 | 0 |
| Z06 Générateur de sites | 39 | 12316 | 4 |
| Z07 Règles | 15 | 1147 | 0 |
| Z08 App de l artisan | 36 | 9183 | 4 |
| Z09 Service atelier et Worker | 12 | 1561 | 0 |
| Z10 Base Supabase | 23 | 1940 | 0 |
| Z11 Essais et vérificateurs | 45 | 9213 | 0 |
| Z12 Prospection | 24 | 24280 | 0 |
| Z13 Autres scripts | 14 | 1455 | 0 |
| Z14 Banque d images | 8 | 3419 | 0 |
| Z15 Données de démonstration | 3 | 3 | 0 |
| Z16 Lanceurs Windows et crochets Git | 14 | 373 | 0 |
| Z17 Configuration | 7 | 890 | 0 |

## Z01 Pilotage de l agent

| Fichier | Lignes |
|---|---|
| `.claude/hooks/commun.mjs` | 92 |
| `.claude/hooks/fin.mjs` | 101 |
| `.claude/hooks/post-ecriture.mjs` | 35 |
| `.claude/hooks/pre-compactage.mjs` | 29 |
| `.claude/hooks/pre-outil.mjs` | 138 |
| `.claude/hooks/session-depart.mjs` | 30 |
| `.claude/settings.json` | 252 |
| `.claude/skills/_partage/references/molettes.md` | 44 |
| `.claude/skills/_partage/references/palettes.md` | 54 |
| `.claude/skills/_partage/references/tells-design.md` | 158 |
| `.claude/skills/_partage/references/tells-texte-fr.md` | 33 |
| `.claude/skills/_partage/references/versions.md` | 43 |
| `.claude/skills/audit-design/SKILL.md` | 101 |
| `.claude/skills/depanner/SKILL.md` | 88 |
| `.claude/skills/fin-de-seance/SKILL.md` | 27 |
| `.claude/skills/preparer-appels/SKILL.md` | 112 |
| `.claude/skills/prospection-sirene/SKILL.md` | 130 |
| `.claude/skills/redaction-fr/SKILL.md` | 107 |
| `.claude/skills/sito-app/SKILL.md` | 45 |
| `.claude/skills/sito-base/SKILL.md` | 38 |
| `.claude/skills/sito-service/SKILL.md` | 37 |
| `.claude/skills/travailler/SKILL.md` | 31 |
| `.claude/skills/veille-concurrence/SKILL.md` | 111 |
| `.mcp.json` | 9 |
| `AGENTS.md` | 18 |
| `CLAUDE.md` | 191 |
| `README.md` | 88 |

## Z02 Mémoire du projet

| Fichier | Lignes |
|---|---|
| `memoire/actions-fabrice.md` | 36 |
| `memoire/comptes-essai.md` | 19 |
| `memoire/de-cowork.md` | 35 |
| `memoire/decisions.md` | 133 |
| `memoire/essais/audit.txt` | 44 |
| `memoire/essais/derniers.txt` | 24 |
| `memoire/essais/disque.txt` | 61 |
| `memoire/journal.md` | 2034 |
| `memoire/maintenant.md` | 111 |
| `memoire/pieges.md` | 121 |
| `memoire/questions.md` | 157 |

## Z03 Spécifications

| Fichier | Lignes |
|---|---|
| `app/PLAN-APP.md` | 489 |
| `app/README.md` | 150 |
| `app/specs/01-PRD.md` | 236 |
| `app/specs/02-TRD.md` | 214 |
| `app/specs/03-APPFLOW.md` | 251 |
| `app/specs/04-DESIGN-SYSTEM.md` | 180 |
| `app/specs/05-SCHEMA-BACKEND.md` | 470 |
| `app/specs/06-PLAN-IMPLEMENTATION.md` | 93 |
| `app/specs/07-TACHES.md` | 146 |
| `app/specs/08-PROSPECTION.md` | 144 |
| `app/specs/README.md` | 21 |

## Z04 Documentation de travail

| Fichier | Lignes |
|---|---|
| `CHANGELOG.md` | 77 |
| `SECURITY.md` | 55 |
| `docs/00-INDEX.md` | 113 |
| `docs/CONSTRAINTS.md` | 58 |
| `docs/CONTEXT.md` | 87 |
| `docs/DETTE.md` | 29 |
| `docs/PROCEDURE-PHOTOS.md` | 43 |
| `docs/REGLE-ESSAIS.md` | 46 |
| `docs/REGLE-TRACABILITE.md` | 75 |
| `docs/SOURCE-UNIQUE.md` | 82 |
| `docs/TROUBLESHOOTING.md` | 45 |
| `docs/audit-2026-09-23.md` | 146 |
| `docs/audit/REGISTRE.md` | 51 |
| `docs/cahier-des-charges.md` | 1448 |
| `docs/etude-framer.md` | 105 |
| `docs/noms-2026-10-05.md` | 75 |
| `docs/outils-claude-code.md` | 44 |
| `docs/prospection-script.md` | 253 |
| `docs/specs/METIERS.md` | 55 |
| `docs/specs/S-MENTIONS.md` | 103 |
| `docs/specs/S-MODELES.md` | 52 |
| `docs/specs/S-PARCOURS-VISITEUR.md` | 62 |
| `docs/specs/S-REFERENCEMENT.md` | 114 |
| `docs/verification-outillage-2026-10-09.md` | 86 |

## Z05 Archives (ne pas lire pour une tâche)

| Fichier | Lignes |
|---|---|
| `docs/historique/README.md` | 23 |
| `docs/historique/architecture-depot.md` | 729 |
| `docs/historique/audit-repos.md` | 2378 |
| `docs/historique/banque-images-v1-2026-09-15.md` | 265 |
| `docs/historique/etat-et-actions.md` | 239 |
| `docs/historique/installation.md` | 68 |
| `docs/historique/nom-produit.md` | 59 |
| `docs/historique/organisation-depots.md` | 284 |
| `docs/historique/politique-mcp.md` | 39 |
| `docs/historique/skills-externes.md` | 31 |
| `docs/historique/suivi-et-continuite.md` | 377 |
| `docs/lecture-structorai/01.md` | 203 |
| `docs/lecture-structorai/02.md` | 241 |
| `docs/lecture-structorai/03.md` | 149 |
| `docs/lecture-structorai/04.md` | 112 |
| `docs/lecture-structorai/05.md` | 184 |
| `docs/lecture-structorai/06.md` | 193 |
| `docs/lecture-structorai/07.md` | 360 |
| `docs/lecture-structorai/08.md` | 280 |
| `docs/lecture-structorai/09.md` | 234 |
| `docs/lecture-structorai/10.md` | 187 |
| `docs/lecture-structorai/11.md` | 330 |
| `docs/lecture-structorai/12.md` | 237 |
| `docs/lecture-structorai/13.md` | 164 |
| `docs/lecture-structorai/14.md` | 129 |
| `docs/lecture-structorai/15.md` | 169 |
| `docs/lecture-structorai/16.md` | 172 |
| `docs/lecture-structorai/17.md` | 165 |
| `docs/lecture-structorai/18.md` | 230 |
| `docs/lecture-structorai/19.md` | 189 |
| `docs/lecture-structorai/20.md` | 298 |
| `docs/lecture-structorai/21.md` | 242 |
| `docs/lecture-structorai/22.md` | 199 |
| `docs/lecture-structorai/23.md` | 209 |
| `docs/lecture-structorai/24.md` | 287 |
| `docs/lecture-structorai/25.md` | 333 |
| `docs/lecture-structorai/26.md` | 287 |
| `docs/lecture-structorai/27.md` | 249 |
| `docs/lecture-structorai/28.md` | 282 |
| `docs/lecture-structorai/29.md` | 289 |
| `docs/lecture-structorai/30.md` | 312 |
| `docs/lecture-structorai/31.md` | 239 |
| `docs/lecture-structorai/32.md` | 120 |
| `docs/lecture-structorai/33.md` | 95 |
| `docs/lecture-structorai/34.md` | 165 |
| `docs/lecture-structorai/35.md` | 182 |
| `docs/lecture-structorai/36.md` | 163 |
| `docs/lecture-structorai/37.md` | 48 |
| `docs/lecture-structorai/38.md` | 146 |
| `docs/lecture-structorai/39.md` | 199 |
| `docs/lecture-structorai/40.md` | 208 |
| `docs/lecture-structorai/41.md` | 156 |
| `docs/lecture-structorai/42.md` | 130 |
| `docs/lecture-structorai/43.md` | 236 |
| `docs/lecture-structorai/44.md` | 424 |
| `docs/lecture-structorai/45.md` | 421 |
| `docs/lecture-structorai/46.md` | 315 |
| `docs/lecture-structorai/47.md` | 510 |
| `docs/lecture-structorai/48.md` | 314 |
| `docs/lecture-structorai/CONSIGNE.md` | 80 |
| `docs/lecture-structorai/README.md` | 14 |
| `docs/lecture-structorai/atelier.md` | 223 |
| `docs/lecture-structorai/web.md` | 291 |
| `docs/lecture-structorai/web2.md` | 275 |

## Z06 Générateur de sites

| Fichier | Lignes |
|---|---|
| `generateur/LISEZMOI.md` | 143 |
| `generateur/archetypes/matiere.mjs` | 496 |
| `generateur/banque/plan-images.json` | 1572 |
| `generateur/charte.mjs` | 309 |
| `generateur/composer.mjs` | 965 |
| `generateur/couture.mjs` | 62 |
| `generateur/echapper.mjs` | 32 |
| `generateur/graine.mjs` | 29 |
| `generateur/main-photos.mjs` | 98 |
| `generateur/metiers/carrelage.json` | 897 |
| `generateur/metiers/couverture.json` | 819 |
| `generateur/metiers/maconnerie.json` | 903 |
| `generateur/metiers/menuiserie.json` | 902 |
| `generateur/metiers/peinture.json` | 818 |
| `generateur/metiers/plomberie.json` | 893 |
| `generateur/metiers/ravalement.json` | 920 |
| `generateur/palette.mjs` | 83 |
| `generateur/polices/archivo-narrow-700.woff2` | binaire |
| `generateur/polices/archivo-wght.woff2` | binaire |
| `generateur/polices/bricolage.woff2` | binaire |
| `generateur/polices/public-sans.woff2` | binaire |
| `generateur/registre.json` | 232 |
| `generateur/sections/appel.mjs` | 106 |
| `generateur/sections/arrivee.mjs` | 161 |
| `generateur/sections/atmosphere.mjs` | 332 |
| `generateur/sections/avis.mjs` | 59 |
| `generateur/sections/comparateur.mjs` | 72 |
| `generateur/sections/formulaire.mjs` | 98 |
| `generateur/sections/mentions.mjs` | 135 |
| `generateur/sections/nuancier.mjs` | 28 |
| `generateur/sections/page-travail.mjs` | 87 |
| `generateur/sections/prix.mjs` | 198 |
| `generateur/sections/referencement.mjs` | 109 |
| `generateur/sirene.mjs` | 74 |
| `generateur/style.mjs` | 212 |
| `generateur/textes.mjs` | 165 |
| `generateur/tirage.mjs` | 199 |
| `generateur/unicite.mjs` | 64 |
| `generateur/zone-matiere.mjs` | 44 |

## Z07 Règles

| Fichier | Lignes |
|---|---|
| `rules/common/00-index.md` | 27 |
| `rules/common/git-workflow.md` | 25 |
| `rules/common/ne-pas-fabriquer.md` | 54 |
| `rules/common/redaction-fr.md` | 54 |
| `rules/common/securite.md` | 45 |
| `rules/methode.md` | 85 |
| `rules/shopify/liquid.md` | 36 |
| `rules/web/accessibilite.md` | 27 |
| `rules/web/client.md` | 59 |
| `rules/web/composition.md` | 201 |
| `rules/web/design-interdits.md` | 151 |
| `rules/web/facture.md` | 137 |
| `rules/web/mouvement.md` | 130 |
| `rules/web/performance.md` | 42 |
| `rules/web/photos.md` | 74 |

## Z08 App de l artisan

| Fichier | Lignes |
|---|---|
| `app/.env.example` | 4 |
| `app/index.html` | 18 |
| `app/package-lock.json` | 6514 |
| `app/package.json` | 25 |
| `app/public/apple-touch-icon.png` | binaire |
| `app/public/icone-192.png` | binaire |
| `app/public/icone-512.png` | binaire |
| `app/public/icone-masque-512.png` | binaire |
| `app/public/icone.svg` | 1 |
| `app/src/App.tsx` | 152 |
| `app/src/apercu-brut.ts` | 61 |
| `app/src/attente.ts` | 123 |
| `app/src/donnees/demo.ts` | 202 |
| `app/src/donnees/index.ts` | 26 |
| `app/src/donnees/supabase.ts` | 238 |
| `app/src/ecrans/Abonnement.tsx` | 82 |
| `app/src/ecrans/Accueil.tsx` | 84 |
| `app/src/ecrans/Adresse.tsx` | 47 |
| `app/src/ecrans/Avis.tsx` | 62 |
| `app/src/ecrans/Chantiers.tsx` | 168 |
| `app/src/ecrans/Compte.tsx` | 147 |
| `app/src/ecrans/Connexion.tsx` | 45 |
| `app/src/ecrans/Google.tsx` | 36 |
| `app/src/ecrans/Inscription.tsx` | 65 |
| `app/src/ecrans/Installer.tsx` | 58 |
| `app/src/ecrans/MonSite.tsx` | 148 |
| `app/src/jour.ts` | 46 |
| `app/src/main.tsx` | 17 |
| `app/src/nettoyer.ts` | 113 |
| `app/src/photo.ts` | 193 |
| `app/src/style.css` | 180 |
| `app/src/types.ts` | 104 |
| `app/src/ui.tsx` | 86 |
| `app/src/video.ts` | 88 |
| `app/tsconfig.json` | 14 |
| `app/vite.config.ts` | 36 |

## Z09 Service atelier et Worker

| Fichier | Lignes |
|---|---|
| `atelier/LISEZMOI.md` | 28 |
| `atelier/boucle.mjs` | 130 |
| `atelier/fabriquer.mjs` | 211 |
| `atelier/heic.mjs` | 32 |
| `atelier/photos.mjs` | 198 |
| `atelier/preparer-recues.mjs` | 136 |
| `atelier/publier-pages.mjs` | 60 |
| `atelier/publier.mjs` | 162 |
| `atelier/supabase.mjs` | 201 |
| `atelier/supprimer-comptes.mjs` | 125 |
| `worker/appels.js` | 177 |
| `worker/routeur.js` | 101 |

## Z10 Base Supabase

| Fichier | Lignes |
|---|---|
| `supabase/README.md` | 183 |
| `supabase/essais/demandes.sql` | 108 |
| `supabase/essais/droits-app.sql` | 97 |
| `supabase/essais/droits.sql` | 58 |
| `supabase/essais/invitations.sql` | 45 |
| `supabase/essais/prevenir.sql` | 39 |
| `supabase/functions/_shared/stripe.ts` | 188 |
| `supabase/functions/inscription/index.ts` | 79 |
| `supabase/functions/inscription/logique.ts` | 102 |
| `supabase/functions/stripe-session/index.ts` | 50 |
| `supabase/functions/stripe-webhook/index.ts` | 48 |
| `supabase/migrations/20261002194303_schema.sql` | 248 |
| `supabase/migrations/20261002194321_droits.sql` | 98 |
| `supabase/migrations/20261002194331_stockage.sql` | 27 |
| `supabase/migrations/20261002194338_metiers.sql` | 22 |
| `supabase/migrations/20261005014022_app.sql` | 261 |
| `supabase/migrations/20261005014036_index_cles.sql` | 5 |
| `supabase/migrations/20261009005808_photo_source.sql` | 20 |
| `supabase/migrations/20261029181645_invitations.sql` | 59 |
| `supabase/migrations/20261103143933_mentions_legales.sql` | 27 |
| `supabase/migrations/20261104044828_prevenir_github.sql` | 46 |
| `supabase/migrations/20261104044905_prevenir_github_correction.sql` | 34 |
| `supabase/migrations/20261104174705_deposer_demande.sql` | 96 |

## Z11 Essais et vérificateurs

| Fichier | Lignes |
|---|---|
| `scripts/capacite-unicite.mjs` | 125 |
| `scripts/contraste-rendu.mjs` | 120 |
| `scripts/essai-accepter.mjs` | 102 |
| `scripts/essai-alt.mjs` | 110 |
| `scripts/essai-app.mjs` | 521 |
| `scripts/essai-appels.mjs` | 419 |
| `scripts/essai-avis.mjs` | 104 |
| `scripts/essai-boucle.mjs` | 209 |
| `scripts/essai-echappement.mjs` | 172 |
| `scripts/essai-fabrication-base.mjs` | 185 |
| `scripts/essai-formulaire.mjs` | 189 |
| `scripts/essai-inscription.mjs` | 197 |
| `scripts/essai-lot.mjs` | 323 |
| `scripts/essai-mentions.mjs` | 196 |
| `scripts/essai-modeles.mjs` | 106 |
| `scripts/essai-navigateurs.mjs` | 91 |
| `scripts/essai-outillage.mjs` | 309 |
| `scripts/essai-photos-artisan.mjs` | 123 |
| `scripts/essai-photos.mjs` | 153 |
| `scripts/essai-preparation.mjs` | 354 |
| `scripts/essai-preparer-appels.mjs` | 278 |
| `scripts/essai-prospection.mjs` | 440 |
| `scripts/essai-publication-prospection.mjs` | 348 |
| `scripts/essai-publication.mjs` | 104 |
| `scripts/essai-refaire-site.mjs` | 132 |
| `scripts/essai-referencement.mjs` | 181 |
| `scripts/essai-service.mjs` | 161 |
| `scripts/essai-stripe.mjs` | 180 |
| `scripts/essai-suppressions.mjs` | 160 |
| `scripts/essai-video-gps.mjs` | 84 |
| `scripts/essais.mjs` | 176 |
| `scripts/faux-cloudflare.mjs` | 217 |
| `scripts/faux-recherche-entreprises.mjs` | 83 |
| `scripts/faux-supabase.mjs` | 174 |
| `scripts/mesure-disque.mjs` | 117 |
| `scripts/mesure-lisibilite.mjs` | 87 |
| `scripts/verifier-depot.mjs` | 108 |
| `scripts/verifier-images.mjs` | 340 |
| `scripts/verifier-mobile.mjs` | 348 |
| `scripts/verifier-ordinateur.mjs` | 317 |
| `scripts/verifier-secrets.mjs` | 115 |
| `scripts/verifier-site.mjs` | 680 |
| `scripts/verifier-textes.mjs` | 95 |
| `scripts/verifier-tracabilite.mjs` | 116 |
| `scripts/verifier-unicite.mjs` | 64 |

## Z12 Prospection

| Fichier | Lignes |
|---|---|
| `prospection/appels.json` | 3 |
| `prospection/communes-13.json` | 865 |
| `prospection/en-ligne.json` | 471 |
| `prospection/essais/recherche-entreprises.json` | 15352 |
| `prospection/metiers.json` | 31 |
| `prospection/modeles/couverture.json` | 1389 |
| `prospection/modeles/peinture.json` | 1396 |
| `prospection/modeles/ravalement.json` | 1393 |
| `prospection/registre-sites.json` | 766 |
| `prospection/registre.json` | 71 |
| `scripts/prospection/accepter.mjs` | 84 |
| `scripts/prospection/cloudflare-pages.mjs` | 220 |
| `scripts/prospection/extraire.mjs` | 371 |
| `scripts/prospection/fabriquer-lot.mjs` | 291 |
| `scripts/prospection/modeles.mjs` | 105 |
| `scripts/prospection/noms.mjs` | 78 |
| `scripts/prospection/page-appels.mjs` | 280 |
| `scripts/prospection/photos-artisan.mjs` | 153 |
| `scripts/prospection/preparer-appels.mjs` | 222 |
| `scripts/prospection/publier.mjs` | 309 |
| `scripts/prospection/qualifier.mjs` | 136 |
| `scripts/prospection/registre.mjs` | 129 |
| `scripts/prospection/reglages-cloudflare.mjs` | 70 |
| `scripts/prospection/verifier-en-ligne.mjs` | 95 |

## Z13 Autres scripts

| Fichier | Lignes |
|---|---|
| `scripts/audit-depot.mjs` | 356 |
| `scripts/autonome.mjs` | 183 |
| `scripts/carte-depot.mjs` | 170 |
| `scripts/ci-github.mjs` | 140 |
| `scripts/compte-essai.mjs` | 85 |
| `scripts/env.mjs` | 35 |
| `scripts/fabriquer-demo.mjs` | 66 |
| `scripts/fichier-unique.mjs` | 88 |
| `scripts/liste-images.mjs` | 43 |
| `scripts/plan-images.mjs` | 101 |
| `scripts/python.mjs` | 36 |
| `scripts/refaire-site.mjs` | 68 |
| `scripts/regles-fr.mjs` | 53 |
| `scripts/secrets-github.mjs` | 31 |

## Z14 Banque d images

| Fichier | Lignes |
|---|---|
| `banque/README.md` | 77 |
| `banque/liste-images.csv` | 865 |
| `banque/liste-images.md` | 1062 |
| `banque/prompts/couverture.md` | 335 |
| `banque/prompts/peinture.md` | 340 |
| `banque/prompts/ravalement-22-images.md` | 208 |
| `banque/prompts/ravalement.md` | 479 |
| `banque/ravalement/provenance.md` | 53 |

## Z15 Données de démonstration

| Fichier | Lignes |
|---|---|
| `donnees/entreprises-demo/480423623.json` | 1 |
| `donnees/entreprises-demo/849891528.json` | 1 |
| `donnees/entreprises-demo/881767842.json` | 1 |

## Z16 Lanceurs Windows et crochets Git

| Fichier | Lignes |
|---|---|
| `git-hooks/pre-commit` | 32 |
| `lanceurs/APP.bat` | 21 |
| `lanceurs/CLAUDE_AUTONOME.bat` | 33 |
| `lanceurs/CLE_CLOUDFLARE.bat` | 29 |
| `lanceurs/CLE_SUPABASE.bat` | 29 |
| `lanceurs/FABRIQUER_DEMO.bat` | 22 |
| `lanceurs/INSTALLER_CLAUDE_CODE.bat` | 24 |
| `lanceurs/INSTALLER_OUTILLAGE.bat` | 28 |
| `lanceurs/POUSSER.bat` | 52 |
| `lanceurs/PREMIER_LANCEMENT.bat` | 23 |
| `lanceurs/PREPARER_APPELS.bat` | 14 |
| `lanceurs/RANGER_IMAGES.bat` | 29 |
| `lanceurs/REVEILLER_SUPABASE.bat` | 23 |
| `lanceurs/SECRETS_GITHUB.bat` | 14 |

## Z17 Configuration

| Fichier | Lignes |
|---|---|
| `.env.example` | 57 |
| `.github/workflows/essais.yml` | 104 |
| `.github/workflows/refaire-site.yml` | 53 |
| `.gitignore` | 47 |
| `.tool-versions` | 2 |
| `package-lock.json` | 605 |
| `package.json` | 22 |

