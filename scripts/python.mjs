// Trouver l'interprète Python qui sait ouvrir un HEIC (Pillow + pillow-heif).
//
// Pourquoi un module à part : deux scripts posent la même question et doivent
// recevoir la même réponse — `essais.mjs` (lancer ou non l'essai des photos) et
// `essai-photos.mjs` (fabriquer les fichiers d'essai). Le nom de l'interprète
// change d'un poste à l'autre : `python3` sous Linux et dans la CI, `python` ou
// `py` sous Windows, où `python3` n'est souvent que la passerelle du Microsoft
// Store, qui ne lance rien.
//
// Jamais avec `shell: true` : sous Windows, Node colle les arguments sans les
// protéger et cmd.exe coupe « import PIL, pillow_heif » sur l'espace et la
// virgule. Panne du 21 octobre 2026 : l'essai des photos se déclarait
// impossible (« manque python + Pillow + pillow-heif ») alors que les deux
// paquets étaient installés.
//
// `SITO_PYTHON` force un interprète (un chemin complet sur une machine où il
// n'est pas dans le PATH ; un nom qui n'existe pas pour le contre-essai).
import { spawnSync } from 'node:child_process';

const CANDIDATS = process.env.SITO_PYTHON
  ? [process.env.SITO_PYTHON]
  : (process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python']);

let cherche = false;
let trouve = null;

// Le nom de l'interprète à lancer, ou null si aucun candidat n'a les paquets.
export function pythonAvecHeif() {
  if (cherche) return trouve;
  cherche = true;
  for (const py of CANDIDATS) {
    const r = spawnSync(py, ['-c', 'import PIL, pillow_heif'], { stdio: 'ignore' });
    if (!r.error && r.status === 0) { trouve = py; break; }
  }
  return trouve;
}
