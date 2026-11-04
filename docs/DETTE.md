# Dette : ce qu'on sait incomplet, et qu'on laisse pour l'instant

Ouvert par Claude (Cowork) le 3 novembre 2026, sur le modèle de
`docs/DETTE-TECHNIQUE.md` du dépôt StructorAI. **Registre unique de la
dette** : un défaut connu, accepté pour le moment, s'écrit ici avec un numéro
qui ne change jamais. Un constat d'audit va dans `docs/audit/REGISTRE.md` ;
s'il est accepté pour plus tard, il reçoit aussi une ligne ici.

**États** : `ouverte`, `réglée` (date et preuve), `abandonnée` (raison et
décision de Fabrice).

| N° | Dette | Risque | Ce qui la règle | Source | État |
|---|---|---|---|---|---|
| D-01 | Les originaux des photos ne sont copiés nulle part hors de Supabase | une photo perdue si le stockage Supabase perd un fichier : Supabase ne sauvegarde pas le stockage, même en Pro | copie de chaque original dans R2 (R2 demande une carte bancaire : décision du 29 oct., ne pas s'en servir) ; à revoir avec Fabrice au premier client | `app/specs/02-TRD.md` P12 ; `app/PLAN-APP.md` §5.3 | ouverte |
| D-02 | Fichiers limités à 50 Mo (offre gratuite) | un ProRAW d'iPhone (25 à 75 Mo) peut dépasser : il est refusé avec un message | Supabase Pro (F11, au premier client), espace porté à 150 Mo | `app/specs/02-TRD.md` P7 ; `app/PLAN-APP.md` §5.3 | ouverte |
| D-03 | Conversion du HEIC envoyé depuis Android ou Windows : prévue par les transformations d'images de Supabase (offre Pro), jamais essayée | une photo HEIC qui ne devient jamais une image du site | F11, puis essai réel | `app/specs/02-TRD.md` §7 | ouverte |
| D-04 | Jetons Google : table `prive.jetons_google` prête, chiffrement non écrit | aucun jeton n'existe encore : risque nul tant que T24 n'est pas faite | T24 | `app/specs/02-TRD.md` X7 | ouverte |
| D-05 | Compteur de vues de la page d'appels : KV n'a pas d'incrément atomique, deux vues à la même seconde peuvent n'en faire qu'une | chiffre « liens ouverts » légèrement sous-estimé ; présenté comme un indice | accepté tel quel | `worker/appels.js` | ouverte |
| D-06 | La base Supabase gratuite se met en pause après quelques jours sans usage | essais contre la vraie base impossibles tant qu'elle dort (F17, 24 oct.) | F11 (Supabase Pro) ; en attendant `lanceurs\REVEILLER_SUPABASE.bat` | `memoire/actions-fabrice.md` F17 | ouverte |
| D-07 | L'envoi des photos reprenable (TUS) n'a jamais tourné contre la vraie base ni sur un vrai réseau coupé | perte de photos sur un chantier en 4G | T04, T30 | `app/specs/02-TRD.md` P8, T7 | ouverte |
| D-08 | Zones sûres de l'iPhone (encoche, barre du bas) : codées, jamais vues sur un iPhone | boutons sous la barre du bas | T30 (F14) | `app/specs/02-TRD.md` T5 | ouverte |
| D-09 | 22 images du ravalement à générer : une paire de sites sur deux montre la même façade coupée | ressemblance entre voisins | F15, puis `node scripts/capacite-unicite.mjs` sur les vraies images | `memoire/maintenant.md` | ouverte |
| D-10 | Codes APE du ravalement : 5 dans `ravalement.json`, 3 dans `plan-images.json` | sélection incohérente selon le fichier lu | T31 | `app/specs/07-TACHES.md` T31 | ouverte |
| D-11 | 15 images de la banque du ravalement inutilisées (matière 02 à 08, ambiance 01 à 05, signes 01 à 03) | images générées pour rien ; décision du 23 sept. : « les images sont utiles » | une tâche à écrire (lot 7) | `memoire/maintenant.md` | ouverte |
| D-12 | Facture électronique : réception obligatoire depuis le 1er sept. 2026, émission pour les PME au 1er sept. 2027 ; Stripe seul ne suffit pas | Sitô ne pourrait pas émettre ses factures à partir de sept. 2027 | plateforme agréée (exemple cité : Billit) ; lot 5 | `app/PLAN-APP.md` §7.6 | ouverte |
| D-13 | Référencement : ni horaires (`openingHoursSpecification`), ni `priceRange`, ni redirection du sous-domaine vers le domaine propre (RS3) | données structurées plus pauvres ; deux adresses indexées le jour où un abonné a son domaine | horaires : écran de l'app (la colonne `profils.horaires` existe) ; prix : règle à décider (une fourchette de tarifs de l'artisan) ; RS3 : `worker/routeur.js` | `docs/specs/S-REFERENCEMENT.md` §3 et §4 ; T51 | ouverte |
| D-14 | Adresse publique d'un abonné : la ligne `adresses` dépend de la ligne `sites`, qui n'est écrite qu'à la première fabrication ; aucun code ne pose l'adresse offerte (le domaine de Sitô n'est pas choisi) | le premier site d'un abonné se fabrique sans URL canonique ni plan du site (avertissement R-ADRESSE) ; il faut le refaire quand l'adresse existe | poser `sites` et l'adresse offerte à l'inscription (`05-SCHEMA-BACKEND.md`, « restent à poser ») une fois le domaine choisi | T51, 3 nov. 2026 | ouverte |
| D-15 | Un projet Cloudflare Pages par site d'abonné ; l'offre gratuite en permet 100 | au 101e abonné, la publication échoue | un seul projet Pages et un Worker qui sert le site selon l'adresse (le routeur `worker/routeur.js` existe déjà), ou demander à Cloudflare de relever la limite | T45, 4 nov. 2026 | ouverte |
| D-16 | Suppression des comptes (T12) : `atelier/supprimer-comptes.mjs` n'est lancé par rien (ni GitHub Actions ni boucle) ; la résiliation Stripe passe par une interface encore sans client réel ; un projet Pages qui a beaucoup de dépôts peut refuser d'être supprimé sans les retirer d'abord (comportement de Cloudflare, non essayé) | une demande échue reste en attente : le compte n'est pas effacé à 30 jours | un passage de nuit dans `.github/workflows/` après F21, le client Stripe à T16, un essai contre le vrai Cloudflare | T12, 4 nov. | ouverte |
