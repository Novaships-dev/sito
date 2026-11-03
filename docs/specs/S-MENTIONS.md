# Spécification : les mentions légales d'un site d'artisan

Écrit par Claude (Cowork) le 3 novembre 2026 pour la tâche **T50** (constat
S-004). Ce n'est pas un avis juridique : chaque obligation cite sa source
officielle, relevée le 3 novembre 2026. Ce qui n'est pas une obligation est
écrit comme tel. **À faire relire par Fabrice** avant la première mise en ligne
d'un site d'abonné.

## 1. Pourquoi

L'app fait saisir à l'artisan sa TVA intracommunautaire, son assurance
décennale (assureur, contrat, zone) et son médiateur de la consommation
(exigence A11 du PRD, marquée « fait »). Le générateur n'en affiche aucune : un
site d'artisan ne montre aujourd'hui que le SIREN, le SIRET, la forme et le
siège, dans la section « vérifiable ». Un site professionnel sans mentions
légales est sanctionné : 75 000 € pour une entreprise individuelle, 375 000 €
pour une société (fiche Service Public F37351).

## 2. À qui elles s'appliquent

| Site | Mentions légales | Raison |
|---|---|---|
| Site d'abonné, publié à l'adresse de l'artisan | **oui, toutes** | site accessible au public, édité par l'entreprise |
| Site de prospection (privé, `noindex`, adresse secrète, retiré à 30 jours) | non exigées par cette spécification | proposition montrée à un seul artisan, pas publiée au nom de l'artisan ; la mention « Proposition de site » le dit (voir S-022) |

## 3. Les mentions, une par une

Source principale : Service Public, « Mentions obligatoires sur le site
internet d'une société », fiche F37351, vérifiée le 13 octobre 2026. Elle
traite aussi de la personne physique (entrepreneur individuel).

| N° | Mention | Contenu | Pour qui | Source | D'où vient la valeur dans Sitô |
|---|---|---|---|---|---|
| ML1 | Dénomination | société : dénomination sociale ; personne physique : nom et prénom suivis de « entrepreneur individuel » ou « EI » | tous | F37351 | Sirene (`entreprises`) |
| ML2 | Forme juridique | SAS, SARL, etc. | société | F37351 | Sirene |
| ML3 | Capital social | montant | société | F37351 | **absent de Sirene** : à saisir par l'artisan dans l'app (champ à ajouter, T50) |
| ML4 | Siège ou domiciliation | adresse | tous | F37351 | Sirene |
| ML5 | Contact | adresse, adresse e-mail, téléphone | tous | F37351 | téléphone et e-mail de `profils` ; adresse de Sirene |
| ML6 | Immatriculation | numéro au registre national des entreprises (RNE, qui regroupe désormais le répertoire des métiers) pour une activité artisanale ; numéro RCS pour une activité commerciale | selon l'activité | F37351 | SIREN de Sirene ; mention RCS ou RNE selon la nature de l'activité (Sirene) |
| ML7 | TVA intracommunautaire | numéro, si l'entreprise y est assujettie | entreprises assujetties | F37351 | `profils.tva_intra` ; sans numéro : ne rien afficher, jamais un numéro calculé |
| ML8 | Hébergeur | nom ou raison sociale, adresse, téléphone | tous | F37351 | Cloudflare : coordonnées à relever sur la page officielle de Cloudflare au moment de T50, et à écrire dans `docs/SOURCE-UNIQUE.md` |
| ML9 | Éditeur et directeur de la publication | l'éditeur est l'entreprise ; le directeur de la publication est son représentant légal (personne physique : l'entrepreneur) | tous | F37351 nomme l'éditeur ; le directeur de la publication vient de l'article 93-2 de la loi du 29 juillet 1982, cité par des fiches de Service Public : **à confirmer** avant T50 | Sirene (dirigeant) ou saisi dans l'app |
| ML10 | Médiateur de la consommation | nom, adresse postale, site internet du médiateur, de manière visible et lisible | tout professionnel qui vend à des particuliers | Code de la consommation L. 616-1 et R. 616-1 ; fiche Service Public F33338 : « Ces informations font partie des mentions obligatoires devant figurer sur le site internet d'un professionnel » | `profils.mediateur_nom`, `mediateur_site` ; **adresse postale à ajouter** (champ manquant, T50) |
| ML11 | Données personnelles | responsable du traitement, données, finalités, base légale, destinataires, durée, droits, saisine de la CNIL | site qui collecte des données (le formulaire de demande, T10 et T11, en collecte) | F37351 | texte commun à écrire (lot 5, `docs/juridique/`), rempli avec l'identité de l'artisan |
| ML12 | Cookies et traceurs | information ; consentement pour les traceurs soumis | site qui en dépose | F37351 | aucun aujourd'hui ; la mesure d'audience prévue (Umami, sans cookie, `docs/CONSTRAINTS.md` C40) n'en dépose pas : le dire |

## 4. Ce qui n'est pas une obligation du site, mais se montre

| N° | Mention | Statut | Source |
|---|---|---|---|
| MR1 | Assurance décennale : assureur, contrat, couverture géographique | **obligatoire sur les devis et les factures**, pas sur le site (article 22-2 de la loi du 5 juillet 1996 ; article L. 243-2 du Code des assurances : attestation jointe aux devis et factures). Sur le site : recommandée, c'est un signe de sérieux pour le visiteur | CAPEB, juillet 2014 ; FFB, attestation jointe depuis le 1er juillet 2016 |
| MR2 | Qualification RGE | affichée seulement si elle existe (déjà dans la section « vérifiable ») | `generateur/composer.mjs`, `verifiable()` |

## 5. Où et comment sur la page

| N° | Règle |
|---|---|
| MP1 | Un lien « Mentions légales » dans le pied de page de **chaque** page du site (accueil et deuxième page), toujours visible |
| MP2 | Une page `mentions-legales.html` dans le dossier du site, servie par le Worker comme les autres pages |
| MP3 | Les coordonnées du médiateur sont aussi sur la page d'accueil, près du contact (« de manière visible et lisible », R. 616-1) |
| MP4 | Une valeur absente se dit « Non renseigné » et la fabrication d'un site d'abonné **s'arrête** si une mention obligatoire pour tous (ML1, ML4, ML5, ML6, ML8, ML9) manque : mieux vaut pas de site qu'un site hors la loi |
| MP5 | Aucune valeur n'est inventée ni déduite (`rules/common/ne-pas-fabriquer.md`) : pas de capital supposé, pas de TVA calculée depuis le SIREN |
| MP6 | Le texte suit les règles de rédaction (`rules/common/redaction-fr.md`), contrôlées par `scripts/verifier-textes.mjs` |

## 6. Ce qui change dans le dépôt (T50)

1. Base : nouvelle migration pour les champs manquants de `profils` (capital, adresse postale du médiateur, directeur de la publication s'il diffère), avec les droits (`.claude/skills/sito-base/SKILL.md`).
2. App : écran « Mon site », section « Mentions légales » : les nouveaux champs ; ce qui manque est montré à l'artisan avant la mise en ligne.
3. Générateur : `generateur/sections/mentions.mjs` (page et lien de pied de page), commun aux quatre archétypes.
4. Vérificateur : `scripts/verifier-site.mjs` gagne le contrôle « mentions légales présentes sur un site d'abonné » (ML1 à ML10 trouvées dans la page, lien présent sur chaque page), essayé sur une copie sans la page : rouge.

## 7. Preuve attendue

Un site d'abonné fabriqué depuis la base, sur chacun des quatre archétypes,
montre chaque mention ML1 à ML10 qui le concerne ; une mention obligatoire pour
tous retirée de la base arrête la fabrication avec son nom ; le contrôle de
`verifier-site` rougit sur une copie sans la page.

## Sources (relevées le 3 novembre 2026)

- [Service Public, F37351 : mentions obligatoires sur le site internet d'une société](https://entreprendre.service-public.gouv.fr/vosdroits/F37351)
- [Service Public, F33338 : médiation des litiges de la consommation](https://entreprendre.service-public.gouv.fr/vosdroits/F33338?profil=tout)
- [DREETS PACA : médiation de la consommation](https://paca.dreets.gouv.fr/Mediation-de-la-consommation-tout-le-monde-y-gagne)
- [CAPEB : mention de l'assurance professionnelle sur les devis et factures (2014)](https://www.capeb.fr/actualites/nouvelle-mention-obligatoire-sur-les-devis-et-les-factures-l-assurance-professionnelle)
- [FFB : attestations d'assurance décennale jointes aux devis et factures](https://www.ffbatiment.fr/actualites-batiment/actualite-ba/au-1er-juillet-2016-elles-devront-etre-jointes-aux-devis-et-factures)
