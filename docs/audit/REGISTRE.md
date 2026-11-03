# Registre des constats d'audit

Ouvert par Claude (Cowork) le 3 novembre 2026, sur le modèle de
`OPS/AUDIT/REGISTRE.md` du dépôt StructorAI. **Registre unique** : tout
constat d'audit du dépôt sito s'écrit ici, avec un numéro qui ne change
jamais. Un constat ne s'efface pas : il passe « clos » avec la date et la
preuve, ou « refusé » avec la raison.

**États** : `ouvert`, `clos`, `refusé`. **Gravité** : `bloquant` (contredit une
décision de Fabrice ou empêche de vendre), `majeur`, `mineur`.

Sources de cet audit : le zip `sito-main` du 29 oct. 2026 (309 fichiers),
lu et rejoué sur une machine neuve le 3 nov. 2026, puis chaque constat
revérifié sur `main` au commit `0dd3776` (3 nov. 2026, après T44) ; comparaison avec
StructorAI (189 fichiers .md) et Atelier (66 fichiers). Rapport complet :
document « Audit sito, Atelier et StructorAI : ce qui manque » (Claude Docs,
3 nov. 2026) ; résumé dans le projet Compréhension.

## Comptage au 3 novembre 2026 (après le lot 2)

**25 constats : 15 ouverts, 10 clos, 0 refusé.**

## Constats

| N° | Gravité | Constat | Preuve | Tâche | État |
|---|---|---|---|---|---|
| S-001 | majeur | `memoire/maintenant.md` se contredit : « 6 façadiers en ligne » puis « Aucun site en ligne » ; décrit encore le modèle d'e-mail « Magic Link » abandonné le 29 oct. ; « Prochaine action » datée du 5 oct. | lignes 33, 242, 286 du fichier du 29 oct. | lot 1 Cowork | clos le 3 nov. : fichier réécrit |
| S-002 | mineur | `README.md` annonce « Résultat du 2 octobre 2026 : trois » sites différents ; la mesure du même soir donne 100 | `README.md` ligne 68 ; `memoire/maintenant.md` « Où en est l'unicité » | lot 1 Cowork | clos le 3 nov. : README corrigé |
| S-003 | bloquant | Aucun référencement sur les sites d'artisan : pas de données structurées `LocalBusiness`, pas d'Open Graph, pas de favicon, pas de `sitemap.xml` ni de `robots.txt` pour un site d'abonné. Contredit la décision du 23 sept. : « L'app sert à son référencement. » | 0 occurrence de `schema.org`, `og:image`, `sitemap` dans `generateur/` | T51 | clos le 3 nov. : `generateur/sections/referencement.mjs`, contrôles R-REGIME, R-OG, R-JSONLD, R-SITE (T51) ; restes en dette D-13, D-14 |
| S-004 | bloquant | Aucune mention légale sur les sites, hors le SIRET : l'app fait saisir assurance décennale, médiateur, TVA (exigence A11, marquée « Fait »), le générateur ne les affiche nulle part ; pas d'hébergeur ni de directeur de publication | 0 occurrence de `decennale`, `mediateur`, `hebergeur` dans `generateur/` ; `app/specs/01-PRD.md` A11 | T50 | clos le 3 nov. : page `mentions-legales.html`, contrôle ML de `verifier-site`, migration des champs manquants (T50) |
| S-005 | mineur | `scripts/essais.mjs` : l'étape « app : parcours et rendu » n'a pas la garde `manque: outilsPhotos` ; sans exiftool, `essai-app.mjs` plante (`spawnSync exiftool ENOENT`) au lieu de dire « NON LANCÉ » | rejoué le 3 nov. sur une machine sans exiftool | T47 | clos le 3 nov. : garde `outilsApp` dans `scripts/essais.mjs` (T47) |
| S-006 | majeur | `echapper()` (`generateur/composer.mjs`) et `ech()` (`generateur/sections/appel.mjs`, `prix.mjs`) n'échappent ni `"` ni `'`. Aucune faille aujourd'hui (les textes de l'artisan vont dans le contenu des balises), mais le premier texte de l'artisan placé dans un attribut ou dans un bloc JSON-LD (T51) ouvre une injection | lecture du code, 3 nov. | T48 | clos le 3 nov. : `generateur/echapper.mjs` seul échappement, `scripts/essai-echappement.mjs` (T48) ; le contre-essai a montré l'injection réelle d'un attribut avec l'ancienne fonction |
| S-007 | bloquant | Safari n'est essayé nulle part : aucun vérificateur ne lance WebKit. Contredit la décision de sept. : tout doit marcher pareil sur iPhone | 0 occurrence de `webkit` comme navigateur dans `scripts/` | T49 | clos le 3 nov. : WebKit dans la CI pour les sites et l app (T49) ; gestes au doigt et vrais appareils restent à faire (F14) |
| S-008 | majeur | 64 des 133 fichiers .md sont des archives : `docs/lecture-structorai/` (53 fichiers, 11 869 lignes, un autre produit) et `docs/historique/` (11). Ils ne servent à aucune tâche et brouillent la recherche | `git ls-files` | lot 1 Cowork | clos le 3 nov. : marqués archives dans `docs/00-INDEX.md`, hors lecture obligatoire |
| S-009 | majeur | La liste des manques écrite le 3 oct. (`docs/lecture-structorai/atelier.md`, « Ce qui manque dans sito », 10 points) n'a été exécutée qu'en partie : faits `.claude/settings.json`, crochet de fin, `.env.example`, CI ; restent fichiers racine, commandes, sous-agents relecteurs, `docs/apis`, `docs/juridique`, `docs/operations`, ADR, skills métier, pièges de méthode | comparaison fichier par fichier, 3 nov. | lots 1 à 7 | ouvert |
| S-010 | majeur | `app/specs/01-PRD.md` ne contient aucune exigence de référencement, alors que son §2 cite la décision du 23 sept. ; le site, cœur du produit, n'y a que 7 lignes (S1 à S7) contre 20 pour l'app | lecture du PRD | lot 2 Cowork | clos le 3 nov. : `app/specs/01-PRD.md` réécrit (site d'abord, S01 à S31, référencement S16 à S18, mentions S15) |
| S-011 | mineur | `app/specs/02-TRD.md` X8 décrit `shouldCreateUser: false` (connexion par code), absent du code depuis T43 ; `app/specs/06-PLAN-IMPLEMENTATION.md` liste encore l'action F3 (« Magic Link ») devenue inutile ; le même plan donne des numéros F1 à F6 qui ne sont pas ceux de `memoire/actions-fabrice.md`, et garde les étapes 8 et 9 (service hébergé) abandonnées le 29 oct. | `grep shouldCreateUser app/src` : 0 | lot 2 Cowork | clos le 3 nov. : `02-TRD.md` X8 et `06-PLAN-IMPLEMENTATION.md` (étape 5, F3, étapes 8 et 9, avertissement sur les numéros F) corrigés |
| S-012 | majeur | La deuxième page n'existe que sur l'archétype `matiere` | `generateur/composer.mjs` ligne 820 | T52 | ouvert |
| S-013 | majeur | 3 métiers sur 16 ont leurs textes ; décision du 23 sept. : « tous les métiers, et à 100 % » | `generateur/metiers/` | T32 | ouvert |
| S-014 | mineur | Les garde-fous de Claude Code reposent sur des motifs de texte dans `pre-outil.mjs`, et `Bash(node *)` est permis : un script Node peut écrire où il veut. Discipline, pas barrière | `.claude/settings.json`, `.claude/hooks/pre-outil.mjs` | question à Fabrice (garde-fou verrouillé) | ouvert |
| S-015 | majeur | Le travail autonome dépend du PC : 2,1 Go libres le 29 oct. (T41 bloquée), coupures d'Internet la nuit, le lanceur ne repart pas seul après un redémarrage | `memoire/maintenant.md`, `memoire/actions-fabrice.md` F19 | F19 ; raccourci `shell:startup` | ouvert |
| S-016 | mineur | La page d'appels n'est protégée que par son slug (adresse secrète) ; le Worker écrit dans KV à chaque vue d'un site de prospection ; aucune limite d'écritures KV de l'offre gratuite n'est écrite dans le dépôt | `worker/appels.js` | lot 3 (`docs/API.md`) | ouvert |
| S-017 | majeur | Aucun CHANGELOG, aucune table unique des chiffres, aucune règle de traçabilité écrite, aucun registre de dette ni d'audit | `git ls-files` | lot 1 Cowork | ouvert jusqu'à la relecture de Fabrice |
| S-018 | majeur | Aucun document pour les points d'entrée (fonction `inscription`, Worker des sites, page d'appels), les codes d'erreur, la mise en ligne et le retour arrière, le plan de continuité | `git ls-files` | lot 3 et lot 6 | ouvert |
| S-019 | majeur | Aucun document juridique de Sitô : CGV, politique de confidentialité, mentions légales de Sitô, registre des traitements, durées de conservation rassemblées | `git ls-files` | lot 5 | ouvert |
| S-020 | majeur | Aucun essai manuel écrit pour un vrai iPhone (liste à cocher par Fabrice), aucune carte des écrans générée | `git ls-files` | lot 4 | ouvert |
| S-021 | mineur | Les originaux des photos ne sont pas recopiés hors de Supabase, qui ne sauvegarde pas le stockage, même en offre Pro | `app/specs/02-TRD.md` P12 « À faire » | `docs/DETTE.md` D-01 | ouvert |
| S-022 | majeur | Le pied de page dit « Proposition de site. Les informations proviennent de bases publiques, les photographies sont des exemples » sur **tous** les sites, abonnés compris ; la section chantier dit « Photographies d'exemple » même avec les photos de l'artisan | `generateur/composer.mjs` lignes 158 et 376 (commit `abb2cbe`) | T54 | ouvert |
| S-023 | majeur | Les textes alternatifs des photos sont écrits en dur pour la façade (« échafaudage monté sur une façade », « la taloche chargée d'enduit appliquée contre le mur », « gros plan sur le grain de l'enduit ») et servent pour tous les métiers : un site de couverture décrit ses photos comme une façade | `generateur/composer.mjs` lignes 95, 155, 156 ; `generateur/archetypes/matiere.mjs` lignes 374 à 477 | T55 | ouvert |
| S-024 | majeur | La section « avis » affiche « Les avis viennent ici » et trois emplacements vides ; rien ne la retire sur un site d'abonné sans avis | `generateur/sections/avis.mjs` | T56 | ouvert |
| S-025 | majeur | La deuxième page de l'archétype matiere (`le-travail.html`) rougit M2 sur téléphone (titre à 9 % de l'écran au lieu de 14 %), sous Chromium comme sous WebKit : `verifier-mobile` n'était lancé que sur l'accueil | `node scripts/verifier-mobile.mjs <site>/le-travail.html`, 3 nov. | T52 | ouvert |
