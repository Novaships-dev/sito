# Procédure : mettre les photos d'un artisan sur son site

Pour Fabrice, en attendant l'app (décision du 4 novembre 2026 : « il envoie ces
photos par mail ou whatsapp pour que je puisse avec l'aide de Claude ajouter a
sont site »). Écrit par Claude (Cowork) ; spécification `docs/specs/S-MODELES.md`.

## Avant la première fois

Le dépôt `sito` doit être **privé** (action F20). Tant qu'il est public, Claude
refuse de ranger une photo d'artisan dedans.

## À chaque artisan qui a accepté

1. **Il a dit oui** : dans la page d'appels, touche « Essai lancé » (ou
   « Abonné »). La préparation du soir réserve son modèle. Pour le faire tout
   de suite, dis à Claude : « accepte <SIREN> ».
2. **Demande-lui ses photos** : au moins une paire avant / après du même
   endroit, une vue du chantier, un geste du métier, un gros plan. Par
   **WhatsApp**, c'est le plus simple : WhatsApp envoie en JPEG. Par mail
   depuis un iPhone, choisir « taille réelle » ; une photo HEIC ne passe pas,
   Claude le dit.
3. **Donne-les à Claude** (dans le chat, ou dans un dossier) avec le SIREN, et
   ce que la loi demande sur son site : son adresse électronique et le nom du
   directeur de la publication (lui, s'il est entrepreneur individuel).
4. **Claude fait le reste** :
   - `node scripts/prospection/photos-artisan.mjs --siren <SIREN> --ranger <dossier>` :
     photos redressées, sans GPS ni appareil, dans `clients/<SIREN>/photos/` ;
   - il regarde chaque photo et écrit son rôle dans `clients/<SIREN>/photos.json` ;
   - il écrit `clients/<SIREN>/entreprise.json` (Sirene, téléphone, mentions) ;
   - `node scripts/prospection/photos-artisan.mjs --siren <SIREN> --fabriquer` :
     le site d'abonné sur le modèle que l'artisan a vu, avec ses photos, dans
     `sites/clients/<SIREN>/`, vérifié ;
   - il te montre le site, vous le peaufinez, puis il le publie.

## Ce qui arrête tout, et c'est voulu

| Message | Ce qu'il faut faire |
|---|---|
| « le dépôt sito est encore public » | F20 |
| « aucune paire avant / après » | demander une photo avant et une après du même endroit |
| « photo HEIC » | la faire renvoyer par WhatsApp |
| « pas encore réservé » | toucher « Essai lancé » ou dire « accepte <SIREN> » |
| « mentions légales manquantes » | demander l'adresse électronique ou le directeur de la publication |
