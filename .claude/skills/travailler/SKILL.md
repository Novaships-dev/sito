---
name: travailler
description: Lance le travail autonome sur Sitô. Active la boucle (le crochet de fin relance tant qu'il reste une tâche) puis enchaîne les tâches de app/specs/07-TACHES.md selon CLAUDE.md, section « Travailler seul ».
disable-model-invocation: true
argument-hint: "[nombre maximal de tours, 300 par défaut]"
---

# Travailler seul sur Sitô

1. Activer la boucle : écrire `.claude/boucle.json` avec
   `{"actif": true, "max": <$ARGUMENTS ou 300>, "debut": "<date ISO>"}`.
   Ce fichier n'est pas versionné. Pour arrêter : `"actif": false`.
2. Lire, dans l'ordre de CLAUDE.md section 1 : `memoire/maintenant.md`,
   `memoire/decisions.md`, `app/specs/07-TACHES.md`, `memoire/pieges.md`.
3. Vérifier que l'environnement tient : `node scripts/essais.mjs`. Si rouge
   avant d'avoir touché à quoi que ce soit, la première tâche est de réparer
   (`.claude/skills/depanner/SKILL.md`), pas de continuer par-dessus.
4. Appliquer CLAUDE.md section 2 à la tâche choisie. Une tâche à la fois.
   Toute panne pendant la tâche : `depanner`, sans attendre personne.
5. Après chaque tâche : essais à 0, état mis à jour, `git add -A`,
   `git commit -m "Txx : ..."`, `git push`.
6. Quand le crochet de fin te relance, il nomme la tâche suivante : la prendre.

## Ce qui arrête la boucle (crochet `.claude/hooks/fin.mjs`)

- plus aucune tâche « à faire » ou « en cours » ;
- trois tours de suite sans changement (ni commit, ni état) : tu es bloqué,
  écris pourquoi dans `memoire/questions.md` avant de t'arrêter ;
- le nombre maximal de tours.

À l'arrêt : `/fin-de-seance`.
