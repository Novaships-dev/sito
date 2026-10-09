# Ce que seul Fabrice peut faire

Claude Code écrit ici, précisément, ce qui l'arrête : un compte, une clé, un
paiement, un appareil, une décision. Chaque action dit où cliquer, pourquoi,
et ce que ça coûte. Les tâches bloquées de `app/specs/07-TACHES.md` citent ces
numéros. Une action faite : la marquer « fait » avec la date, et la tâche
repasse « à faire » à la séance suivante.

**Rien de payant n'est ouvert sans Fabrice.** Les coûts viennent de
`app/specs/06-PLAN-IMPLEMENTATION.md` §4 (relevés le 3 octobre 2026).

| N° | Action | Pourquoi | Coût | État |
|---|---|---|---|---|
| F0 | Installer Claude Code sur l'ordinateur : PowerShell, `irm https://claude.ai/install.ps1 \| iex`, puis `claude` une fois et se connecter (abonnement Pro ou Max) | sans lui, rien ne tourne | compris dans l'abonnement Claude | à faire |
| F1 | Créer le fichier `.env` à la racine de `sito` : copier `.env.example` en `.env`, puis remplir `SUPABASE_CLE_SERVICE` (Supabase > projet sito > Project Settings > API Keys > « secret key ») et `SITO_COMPTE_ESSAI_COURRIEL` (ta Gmail avec `+sito` avant le @) | compte d'essai et essais contre la vraie base (T03, T04) | 0 € | à faire |
| F2 | Premier lancement : double-clic sur `lanceurs\CLAUDE_AUTONOME.bat`, accepter « faire confiance à ce dossier » et le serveur Playwright, une seule fois | après, plus aucune question au démarrage | 0 € | à faire |
| F3 | Supabase > Authentication > Emails > « Magic Link » : ajouter `{{ .Token }}` dans le message (le code à 6 chiffres) | sans lui, l'e-mail reçu contient un lien, pas le code que l'app demande | 0 € | à faire |
| F4 | Vérifier que Claude Code voit Supabase : dans une session, taper `/mcp`. Si « claude.ai Supabase » n'apparaît pas, l'ajouter : `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=magxzrpboyrzguuocjgj"` puis `/mcp` > supabase > Authenticate | migrations et essais de droits (T05) | 0 € | à faire |
| F5 | Cloudflare : créer le compte, passer Workers en payant, créer un jeton API (Workers, R2, KV, zone) et le mettre dans `.env` (`CLOUDFLARE_*`) | héberger les sites et l'app (T14, T21, T27) | 5 $/mois + usage | à faire |
| F6 | Choisir le nom et le domaine de Sitô (liste : `docs/noms-2026-10-05.md`, vérifier INPI et Pappers), l'acheter | adresse offerte `nom.<domaine>`, e-mail, Google | selon le nom | à faire |
| F7 | Stripe : créer le compte, rester en mode test, mettre les clés de test dans `.env` (`STRIPE_*`) | abonnement (T18) | frais par paiement seulement | à faire |
| F8 | Gandi : compte, jeton API (bac à sable d'abord) dans `.env` (`GANDI_JETON`) ; le passage « revendeur » est irréversible | domaines des artisans (T21) | domaines au prix public | à faire |
| F9 | Choisir l'hébergement du service et d'Umami (Railway ou équivalent) | service en ligne (T15, T23) | à relever | à faire |
| F10 | Serveur d'e-mail (Brevo ou équivalent) : identifiants SMTP dans Supabase > Authentication > SMTP | le serveur de Supabase n'envoie que 2 e-mails par heure (T26) | à relever | à faire |
| F11 | Supabase Pro au premier client (décision du 5 octobre) | sauvegardes, 150 Mo par fichier, conversion HEIC | 25 $/mois | à faire |
| F12 | Compte Google Play (organisation : numéro D-U-N-S ; ou personnel : 12 testeurs pendant 14 jours) | app Android (T29) | 25 $ une fois | à faire |
| F13 | Artisan pilote avec fiche Google vérifiée depuis 60 jours, qui ajoute l'e-mail de Sitô comme gestionnaire ; puis la demande d'accès à l'API | avis et fiche Google (T25) | 0 € | à faire |
| F14 | 4 ou 5 vraies photos : iPhone HEIC, Live Photo, ProRAW, Android ; et un essai de l'app sur ton iPhone | essais sur vrais appareils (T30) | 0 € | à faire |
| F15 | Générer les 22 images du ravalement (prompts : `banque/prompts/ravalement.md`), les ranger dans `images/ravalement/sources/` | sites (T33) | 0 € | à faire |
| F16 | Supprimer les projets Supabase AgentShield et auto-conseil (suppression définitive) | ménage | 0 € | à faire |
