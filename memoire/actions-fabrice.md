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
| F0 | Installer Claude Code : double-clic sur `lanceurs\INSTALLER_CLAUDE_CODE.bat` (installateur officiel, sans droits d'administrateur ; résultat dans `installation-claude.log`) | sans lui, rien ne tourne | compris dans l'abonnement Claude | **fait** (24 oct. : Claude Code tourne sur le PC, c'est lui qui écrit cette ligne) |
| F1 | La clé secrète Supabase : double-clic sur `lanceurs\CLE_SUPABASE.bat`. La page des clés s'ouvre ; copier la « secret key » (`sb_secret_…`), la coller dans la fenêtre, Entrée. Le reste du `.env` est déjà rempli (11 oct.) ; le script crée ensuite le compte d'essai | compte d'essai et essais contre la vraie base (T03, T04) | 0 € | à faire (clé seulement) |
| F2 | Premier lancement, une seule fois : double-clic sur `lanceurs\PREMIER_LANCEMENT.bat`, accepter « faire confiance à ce dossier », le serveur Playwright et le mode auto s'il le propose, puis taper `/exit` et Entrée | sans cette confiance, Claude Code ignore les autorisations du projet (message vu le 10 oct. : « Ignoring 99 permissions.allow entries… not been trusted ») ; ensuite `CLAUDE_AUTONOME.bat` tourne sans fenêtre ni question | 0 € | **fait** (24 oct. : `hasTrustDialogAccepted` vrai pour ce dossier dans `~/.claude.json`) |
| F3 | Modèle d'e-mail « Magic link or OTP » avec le code `{{ .Token }}` : **impossible sans serveur d'envoi** (Supabase, 11 oct. : « Set up custom SMTP to edit templates »). Se fait juste après F10 ; Claude le fait alors dans Chrome (texte prêt dans `memoire/journal.md`, 11 oct.) | sans lui, l'e-mail contient un lien et pas le code que l'app demande : les artisans ne peuvent pas se connecter. Les essais de Claude Code n'en dépendent pas (code obtenu par l'API d'administration) | 0 € | bloqué par F10 |
| F4 | Vérifier que Claude Code voit Supabase : dans une session, taper `/mcp`. Si « claude.ai Supabase » n'apparaît pas, l'ajouter : `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=magxzrpboyrzguuocjgj"` puis `/mcp` > supabase > Authenticate | migrations et essais de droits (T05) | 0 € | **fait** (24 oct. : les outils `Supabase` sont bien offerts à la session) |
| F5 | Cloudflare : créer le compte **gratuit** (suffit pour la prospection, T41), puis double-clic sur `lanceurs\CLE_CLOUDFLARE.bat` (fait par Claude Code en T38) qui range le jeton dans `.env`. Plus tard, pour l'hébergement des vrais sites : passer Workers en payant (5 $/mois) | héberger les sites et l'app (T14, T21, T27) | 5 $/mois + usage | à faire |
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
| F17 | **Réveiller la base Supabase** : double-clic sur `lanceurs\REVEILLER_SUPABASE.bat`, puis « Restore project » sur la page du projet `sito`, et attendre « Active healthy ». Le projet gratuit s'est mis en pause faute d'usage (dernier usage : 11 oct.) | la base ne répond plus : « Database is possibly not accessible at the moment ». Les essais de droits (T05), le compte d'essai (T03) et l'essai de bout en bout (T04) ne peuvent pas tourner. Tant qu'elle dort, `get_advisors` rend une liste vide qui ne prouve rien | 0 € (la pause revient après quelques jours sans usage ; F11, Supabase Pro, l'évite pour de bon) | à faire |
| F18 | Générer dans ChatGPT les 32 images de **couverture** et les 32 de **peinture** avec les textes prêts (`banque/prompts/couverture.md`, `peinture.md`, T35), les ranger dans `images/couverture/` et `images/peinture/` | sites des deux nouveaux métiers pour la prospection (T37) | 0 € (abonnement ChatGPT) | à faire |
