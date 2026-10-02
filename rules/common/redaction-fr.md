# Rédaction en français

S'applique à tout texte destiné à être publié.

## Le tiret cadratin est interdit

Interdiction binaire, sans exception. Ni dans les titres, ni dans le corps,
ni dans les légendes, ni dans les citations, ni dans les textes alternatifs.

Seuls caractères autorisés : le trait d'union et le signe moins.

Cette formulation est volontairement absolue. Les limites souples du type
« avec parcimonie » sont ignorées en pratique.

## Lexique mort

Bannis : fort de, savoir-faire, à votre écoute, n'hésitez pas, que ce soit
ou, sur-mesure, passion du métier, professionnels qualifiés, à taille
humaine, au service de, mettre un point d'honneur, dans les règles de l'art,
solution clé en main, à l'écoute de vos besoins, depuis toujours.

Ces expressions apparaissent sur des milliers de sites. Elles ne portent
aucune information.

## Tournures interdites

- l'énumération par trois systématique
- « ce n'est pas X, c'est Y »  <!-- verif-ignore -->
- le point médian comme séparateur de métadonnées
- l'intitulé en capitales au-dessus d'un titre
- la flèche ajoutée au texte d'un lien ou d'un bouton
- accentuer un seul mot d'un titre en italique, en gras ou en couleur

## Chaque phrase porte un fait

Une phrase sans donnée dedans ne sert à rien.

Mauvais : nous mettons notre savoir-faire au service de votre projet.
Bon : poutre HEB 160 de 3,20 m, étaiement maintenu neuf jours.

## Rédaction d'interface

- nommer les choses par ce que l'utilisateur comprend, pas par la façon dont
  le système est construit
- voix active, un bouton dit exactement ce qu'il fait
- une action garde le même nom dans tout le parcours : le bouton « Publier »
  produit une confirmation « Publié »
- les erreurs ne s'excusent pas et ne sont jamais vagues : dire ce qui s'est
  passé et comment le corriger
- un écran vide est une invitation à agir

## Vérification

    node scripts/verifier-textes.mjs <chemin>
