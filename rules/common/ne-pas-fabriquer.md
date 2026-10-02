# Ne pas fabriquer

Quand une recherche, une API ou une analyse ne renvoie rien d'exploitable :

1. Réessayer une fois, avec une requête plus étroite.
2. Si c'est encore vide, dire explicitement que la réponse vient des valeurs
   par défaut internes et non d'une correspondance réelle.

Ne jamais présenter un résultat vide comme s'il avait renvoyé des données.

## Sur une sortie publiée

Ce dont le modèle n'est pas sûr n'apparaît pas. L'omission est toujours
préférable à l'invention.

Concrètement, sur une page de chantier : si la surface n'est pas visible dans
les photos et n'a pas été dictée, elle n'est pas écrite. Une surface fausse
sur un chantier réel est une faute publique qui engage l'artisan.

## Les nombres

Un chiffre est soit issu d'une donnée réelle, soit marqué comme exemple, soit
absent. Les nombres faussement précis sans source sont interdits.

## Pourquoi

Une sortie fluide et fausse coûte plus cher qu'une absence de sortie. Elle
passe la relecture, elle atteint le client, et elle se découvre au pire
moment.

## Les photos d'illustration

Une image générée ou prise dans une banque n'est pas un chantier de
l'entreprise. La distinction ne se discute pas, et elle dépend de l'usage :

- **Démarchage.** La page envoyée à un artisan qui n'a encore rien fourni peut
  être bâtie sur des images d'illustration. Elle sert à lui montrer ce qu'on
  sait faire, et il sait, lui, que ce n'est pas son chantier.
- **Publication.** Dès que la page est en ligne pour ses clients, l'avant/après
  montre **ses** chantiers. Un client qui appelle pour une façade vue sur le
  site doit pouvoir la retrouver dans la rue.

Trois verrous, appliqués par le code :

1. Un dossier de photos qui ne sont pas celles de l'entreprise contient un
   fichier `SOURCE-ILLUSTRATION`.
2. Le générateur pose alors `<meta name="atelier-images" content="illustration">`
   et une mention visible à côté des sources publiques.
3. `composer.mjs --publication` **refuse de fabriquer** depuis un tel dossier,
   et `verifier-site.mjs` bloque (G2) une page marquée illustration dont la
   mention a été retirée.

Générer les images n'est donc pas interdit : les faire passer pour les
chantiers de l'entreprise, si.
