---
name: fin-de-seance
description: Clôt une séance de travail sur Sitô pour que la suivante reprenne sans rien perdre. À lancer quand la boucle s'arrête, avant de rendre la main, ou quand Fabrice le demande.
disable-model-invocation: true
---

# Fin de séance

1. `node scripts/audit-depot.mjs` (décision du 29 oct. : doublons, fichiers
   morts, temporaires) : il corrige ce qu'il a le droit de corriger, écrit
   `memoire/essais/audit.txt` et la place libre en tête de
   `memoire/maintenant.md`. Sortie 1 : lire « Reste à corriger » et le
   traiter (ou l'écrire au journal). Sous 1 Go : plus aucune fabrication,
   et l'écrire dans `memoire/actions-fabrice.md`, avec le tableau de
   `node scripts/mesure-disque.mjs` (lecture seule, ≈ 5 min) pour dire à
   Fabrice quoi vider.
   Puis `node scripts/essais.mjs` : noter le verdict.
2. Réécrire `memoire/maintenant.md` : ce qui marche (mesuré), ce qui manque,
   les tâches bloquées et leur action de Fabrice, la prochaine tâche.
   Rester court : c'est la première chose lue à la séance suivante.
3. Ajouter à la fin de `memoire/journal.md` : date, tâches faites, commits.
4. Ajouter à `memoire/pieges.md` chaque panne rencontrée : date, panne,
   cause, garde mise en place.
5. Vérifier `memoire/actions-fabrice.md` et `memoire/questions.md` : chaque
   blocage y est, précis.
6. `git add -A`, `git commit -m "fin de séance : ..."`, `git push`.
   Si le push échoue, l'écrire en tête de `memoire/maintenant.md`.
