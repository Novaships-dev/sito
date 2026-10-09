# Outils pour Claude Code sur Sitô

9 octobre 2026. Recherche faite à la demande de Fabrice : « va sur GitHub
chercher des outils qui pourraient aider Claude Code ». Écrit par Claude, à
partir de la documentation officielle et des dépôts officiels ; dates et
sources ci-dessous. Ce n'est pas une décision de Fabrice.

## Retenu et branché dans le dépôt

| Outil | Source | Ce qu'il apporte | Où |
|---|---|---|---|
| Réglages de projet de Claude Code (autorisations, crochets) | docs officielles, code.claude.com/docs/en/settings, /permissions, /hooks | travailler sans demander l'autorisation à chaque commande ; interdits (secrets, push forcé, suppression) ; contrôles automatiques | `.claude/settings.json`, `.claude/hooks/` (Node, pour Windows) ; **validé contre le schéma officiel** (SchemaStore, 142 propriétés, 0 erreur) |
| Mode « auto » | code.claude.com/docs/en/permission-modes | un second modèle juge chaque action à la place de Fabrice ; recommandé pour le travail sans surveillance | `lanceurs/CLAUDE_AUTONOME.bat` (`--permission-mode auto`) ; ne peut pas être mis dans les réglages du projet (la doc l'interdit) |
| Boucle « Ralph Wiggum » | extension officielle `anthropics/claude-code/plugins/ralph-wiggum` | un crochet de fin qui relance Claude tant que le travail n'est pas fini | même principe, réécrit en Node et piloté par `app/specs/07-TACHES.md` : `.claude/hooks/fin.mjs`, avec arrêt si rien ne bouge trois tours de suite |
| Skills de projet | code.claude.com/docs/en/skills | savoir-faire chargé quand la tâche en a besoin ; un skill = un dossier `.claude/skills/<nom>/SKILL.md` (les fichiers plats ne sont pas lus : panne de StructorAI) | `.claude/skills/` |
| Playwright MCP | `microsoft/playwright-mcp` (officiel Microsoft) | Claude ouvre l'app dans un navigateur, clique, lit la page | `.mcp.json` |
| Supabase MCP | supabase.com/docs/guides/getting-started/mcp (officiel) | migrations, SQL, conseillers, journaux de la vraie base | le connecteur Supabase du compte Claude de Fabrice ; sinon commande de `memoire/actions-fabrice.md` F4, limitée au projet `sito` |
| GitHub Actions | docs GitHub | essais rejoués depuis un clone neuf à chaque envoi, sans secret | `.github/workflows/essais.yml` |

## Repéré, pas installé (à décider, ou plus tard)

| Outil | Source | Pourquoi pas maintenant |
|---|---|---|
| Supabase Agent Skills (`npx skills add supabase/agent-skills`) | `supabase/agent-skills` (officiel) | outil tiers qui s'installe sur la machine : selon `rules/common/securite.md`, revue avant installation ; `.claude/skills/sito-base` couvre la procédure du dépôt |
| Extension `frontend-design` | `anthropics/claude-code/plugins` (officiel) | utile pour l'interface ; les règles de design de Sitô (`rules/web/`, `04-DESIGN-SYSTEM.md`) priment |
| Extensions `code-review`, `pr-review-toolkit`, `security-guidance` | `anthropics/claude-code/plugins` (officiel) | utiles en revue ; à installer avec `/plugin` si Fabrice le souhaite |
| Chrome DevTools MCP | `ChromeDevTools/chrome-devtools-mcp` (officiel Google) | recouvre en partie Playwright MCP |
| Context7 (documentation à jour des bibliothèques) | `upstash/context7` | demande une clé d'API pour le serveur distant |
| Action GitHub `claude-code-action` | docs officielles | demande une clé d'API Anthropic payante dans GitHub |

## Limites qui restent, dites franchement

- Claude Code ne peut pas ouvrir de compte, payer, ni acheter un domaine : ces
  actions sont dans `memoire/actions-fabrice.md`.
- Le mode « auto » dépend du modèle et de l'abonnement ; s'il n'est pas
  disponible, la session démarre en mode manuel, et les autorisations du
  projet évitent la plupart des questions.
- Sous Windows sans Git Bash, Claude Code utilise PowerShell : les
  autorisations PowerShell sont aussi dans les réglages.
- Le premier lancement demande une fois de faire confiance au dossier.
