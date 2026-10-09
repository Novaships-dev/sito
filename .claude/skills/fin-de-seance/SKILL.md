---
name: fin-de-seance
description: Clôt une séance de travail sur Sitô pour que la suivante reprenne sans rien perdre. À lancer quand la boucle s'arrête, avant de rendre la main, ou quand Fabrice le demande.
disable-model-invocation: true
---

# Fin de séance

1. `node scripts/essais.mjs` : noter le verdict.
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
