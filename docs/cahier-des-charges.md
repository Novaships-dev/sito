> **À lire avant tout le reste de ce document.**
> Rédigé par Claude début septembre 2026, **jamais validé par Fabrice**. Il ne
> fait pas foi et ne doit pas être cité comme une décision. Les décisions sont
> dans `memoire/decisions.md`. Trois points de ce document ont été contredits
> par Fabrice depuis : les photos de banque (il fait générer des images par
> métier pour présenter les sites), le test terrain de trois semaines (rejeté),
> les vingt gabarits dessinés à la main (le générateur fonctionne autrement).
> Les sections 5.13, 5.14, 7.4 et 7.5 restent la meilleure matière pour l'app,
> voir `app/README.md`.

# Sitô — Cahier des charges

### App de création de site et de publication de chantiers pour artisan du bâtiment

**Version 7.0 — septembre 2026**

> **Principe de livraison : une seule version, la version finale.** Pas de MVP, pas de V1 dégradée. Ce qui sort est complet, ou ne sort pas.

---

## 1. En une phrase

L'app crée le site de l'artisan en dix minutes, sans qu'il rédige quoi que ce soit. Ensuite, chaque chantier qu'il photographie devient une page réelle qui vient l'enrichir. Le site n'est jamais fini : il grossit tout seul.

Deux phases, deux promesses distinctes :

| | Phase 1 — Création | Phase 2 — Enrichissement |
|---|---|---|
| Quand | jour 1, une fois | en continu, chantier après chantier |
| Effort | les infos + ses chantiers passés | 90 secondes par chantier |
| Produit | un site complet en ligne | 2 à 6 pages réelles de plus par mois |

---

## 2. Pourquoi

Un site d'artisan classique est figé le jour de la livraison. Il ne bouge plus, il ne se classe pas, le client paie pendant des années sans savoir si ça marche.

Or une entreprise du bâtiment produit chaque semaine le meilleur contenu qui existe dans son métier : des chantiers réels, photographiés, localisés. Ce contenu ne finit nulle part.

Le produit fait les deux : il donne un site tout de suite, puis il branche la production de chantiers dessus. Chaque chantier devient une page unique et géolocalisée — ce que Google veut voir, et ce qu'aucun concurrent français ne fait.

**Ce n'est pas seulement un générateur de site. C'est un site qui se nourrit du travail réel.**

---

## 3. Pour qui

**Cible primaire :** artisan ou TPE du bâtiment, 0 à 5 salariés, chiffre d'affaires 150 à 400 k€.

Profil : il a déjà un site (ou pas), il photographie ses chantiers, il est trop cher pour les offres à 15 €/mois génériques et trop petit pour une agence à 3 000 €. Il est souvent coincé dans un contrat de 4 ans qu'il regrette.

**Corps de métier couverts : tous ceux où l'avant/après est réellement visible.**

| Métier | Ce qui se voit |
|---|---|
| Ravalement de façade | transformation totale, la plus spectaculaire |
| Isolation thermique extérieure | façade refaite entièrement |
| Nettoyage et démoussage façade / toiture | avant/après immédiat, très fort |
| Couverture, toiture, zinguerie | toiture reprise, faîtage, gouttières |
| Peinture intérieure et extérieure | pièce transformée |
| Plâtrerie, placo, cloisons | volumes redessinés |
| Carrelage et faïence | sol et murs refaits |
| Sols : parquet, souple, béton ciré | pièce méconnaissable |
| Rénovation de salle de bain | l'un des plus recherchés en ligne |
| Rénovation de cuisine | idem |
| Menuiserie : fenêtres, portes, escaliers, dressings | pose visible, avant/après net |
| Maçonnerie : murs, ouvertures, terrasses | structure modifiée |
| Serrurerie et métallerie : portails, garde-corps, verrières | ouvrage posé |
| Paysagisme, terrasses, clôtures, allées | extérieur transformé |
| Piscine et aménagement extérieur | très visuel |
| Terrassement et VRD | terrain avant / après |
| Poêles, cheminées, inserts | installation visible |
| Rénovation globale | le plus fort de tous |

**Écartés, et pourquoi :** dépannage plomberie, dépannage électrique, vitrerie, chauffagiste pur, ramonage. L'intervention ne produit pas d'image parlante — le produit n'a rien à leur offrir et ils feraient chuter la qualité moyenne des sites.

**Hors cible :** entreprises de plus de 10 salariés, gros œuvre, marchés publics, neuf.

---

## 4. PHASE 1 — La création du site

**Objectif : site complet en ligne en dix minutes, sans une ligne rédigée par l'artisan.**

### 4.1 Le SIRET

Champ unique à l'ouverture. L'API entreprises publique renvoie : raison sociale, adresse, code APE, forme juridique, date de création, effectif.

Aucune saisie. Pas de Google, pas de scraping : donnée publique ouverte.

### 4.2 Le métier et les prestations

- Métier pré-sélectionné depuis le code APE, confirmé d'un tap.
- Prestations : cases à cocher dans la liste propre au métier. Il décoche ce qu'il ne fait pas.
- Il peut en ajouter une hors liste.

### 4.3 La zone d'intervention

Commune du siège pré-remplie. Il indique un rayon (10 / 20 / 30 / 50 km) ou sélectionne des communes précises. La liste est construite automatiquement.

La zone sert au maillage et au balisage. **Une page commune n'existe que si un chantier réel y a été publié** — que ce soit à la création (4.5) ou plus tard. Jamais une page par commune de la zone (voir 6.2).

### 4.4 Les preuves

- **RGE** : vérifié automatiquement dans la base publique à partir du SIREN. Badge affiché si trouvé.
- **Décennale** : assureur et numéro de contrat, saisis une fois, affichés partout.
- **Qualibat, autres qualifications** : saisie optionnelle.
- **Ancienneté et effectif** : repris de la donnée publique.

### 4.5 Ses chantiers passés

Il a déjà des photos sur son téléphone. Il les met, autant qu'il veut, aucun minimum, aucun maximum.

**L'app le guide chantier par chantier.** Elle ne lui laisse pas un tas de photos à débrouiller seul :

1. « Ajoute les photos de ton premier chantier. »
2. Il sélectionne dans sa pellicule celles qui vont ensemble.
3. L'app trie, classe et propose les paires avant/après. Il valide d'un swipe.
4. Il enchaîne les 6 écrans du questionnaire (voir 5.5).
5. « Un autre chantier ? » — oui, on recommence. Non, on passe à la suite.

Chaque chantier renseigné devient **une page de réalisation complète**, identique à celles produites en phase 2. Pas une galerie sans texte : une vraie page qui se classe.

S'il n'a aucune photo, il va en prendre. Le site attend.

**Jamais de photo de banque d'images.** C'est ce qui rend tous les sites d'artisans identiques et faux.

### 4.6 Le ton

Trois options en boutons : sobre et technique / chaleureux et proche / haut de gamme. Ça pilote la rédaction de tout le site.

### 4.7 La génération

Le système produit :

- accueil, pages prestations, page réalisations, page à propos, contact, mentions légales pré-remplies avec SIRET, forme juridique et assurance ;
- les textes dans le ton choisi, à partir du métier, des prestations, de la zone et de l'ancienneté ;
- les pages de réalisation des chantiers renseignés en 4.5, et les pages communes correspondantes ;
- le balisage `LocalBusiness` et `Service`, `sitemap.xml`, `robots.txt`.

Le site part donc en ligne avec du contenu réel dès le premier jour, pas avec une coquille vide.

### 4.8 Le choix visuel

Trois propositions générées pour lui, avec son propre contenu déjà dedans. Il en choisit une d'un tap, ou en demande d'autres. Il peut changer de template ou de palette plus tard sans perdre le contenu.

### 4.9 Le domaine

Proposé automatiquement à partir du nom et de la ville, avec deux ou trois variantes disponibles. Acheté et **déposé au nom de l'artisan**, transférable à tout moment.

### 4.10 La publication

Aperçu complet, un bouton. Le site est en ligne. Search Console connectée dans la foulée.

L'inscription ne demande aucun moyen de paiement : il voit son site en entier avant de décider.

---

### 4.11 S'il a déjà un site

Cas majoritaire. Beaucoup sont chez Solocal, Local.fr ou Simplébo, souvent sous contrat.

**Récupération.** L'app parcourt l'ancien site, extrait textes, photos et coordonnées, et pré-remplit la création. Il ne recommence pas de zéro.

**Le domaine décide de tout.**
- *Domaine à son nom* : on le pointe sur le nouveau site, il garde tout son référencement acquis. Cas idéal.
- *Domaine détenu par le prestataire* : demande de transfert, souvent lente et parfois refusée. L'app génère le courrier type.
- *Transfert impossible* : nouveau domaine, et on assume la perte. À dire clairement avant la vente, jamais après.

**Redirections.** Table de correspondance ancienne URL → nouvelle, 301 systématiques. C'est ce qui évite de repartir à zéro sur Google.

**Le contrat en cours.** L'app demande la date de fin et le préavis — beaucoup sont engagés 4 ans avec reconduction tacite. Elle pose un rappel avant la date limite de résiliation.

**Il construit maintenant, il bascule plus tard.** Le nouveau site vit sur un sous-domaine tant que l'ancien contrat court. Le jour où le domaine se libère, on bascule en un clic. Il ne perd pas un an à attendre.

---

## 5. PHASE 2 — L'enrichissement en continu

**Objectif : 90 secondes par chantier, sinon il ne le fera pas.**

### 5.1 Le rappel

Une notification quotidienne, texte générique : *« Pense à photographier ton chantier. »*

- Une seule notif, tous les jours, même texte.
- Couvre l'avant et l'après sans que l'app ait à savoir où en est le chantier.
- Réglable dans l'app : quotidien / 2 fois par semaine / off.

Le bouton de réglage doit exister et être visible. Un artisan sans option pour espacer une notif inutile la coupe au niveau du système, et on perd tout.

### 5.2 L'envoi

Sélection multiple depuis la pellicule, d'un coup. Rien d'autre à faire.

Mode caméra optionnel : au moment de shooter l'« après », la photo « avant » s'affiche en transparence sur le viseur. Il cale, il déclenche. Le recalage devient quasi parfait sans traitement lourd.

### 5.3 Le tri automatique

- Ordonnancement par horodatage — premières prises = avant, dernières = après.
- Classement de chaque photo par modèle de vision : avant / en cours / après / détail / matériel.
- Détection des paires probables (même angle, état différent).

**Seules les paires douteuses lui sont soumises.** Quand la correspondance est évidente — même cadrage, même pièce, écart de temps net — elle est retenue sans rien demander. Il ne voit que les cas où le système hésite, et il tranche d'un swipe. En pratique, souvent zéro question.

### 5.4 L'alignement avant/après

Recalage de la seconde photo sur la première : détection de points d'intérêt, estimation d'homographie, déformation, recadrage sur la zone commune.

Ça fonctionne en bâtiment parce que la géométrie reste stable — murs, huisseries et angles ne bougent pas, seule la finition change.

Si l'erreur de reprojection dépasse le seuil : bascule automatique en côte à côte plutôt qu'un curseur bancal.

### 5.5 L'analyse par le modèle

**Il ne remplit aucun formulaire.** Les photos partent vers un modèle de vision qui lit le chantier.

**Le contexte qu'on lui donne :** son métier et ses prestations (connus depuis la création), les dates de prise de vue, la commune issue des coordonnées de la photo, ses chantiers précédents pour rester cohérent d'une page à l'autre.

**Ce que le modèle extrait, en données structurées :**

| Champ | Fiabilité depuis l'image |
|---|---|
| Type d'ouvrage | élevée |
| Précision de l'ouvrage (enduit gratté ou taloché, type de pose) | bonne |
| Type de lieu (façade, salle de bain, toiture, cuisine) | élevée |
| Matériaux et finitions visibles | bonne |
| État avant, travaux réalisés | élevée |
| Contraintes visibles : support dégradé, fissures, échafaudage, hauteur, site occupé | bonne |
| Durée | calculée entre la première et la dernière photo |
| Commune | coordonnées de la photo |
| Surface | nulle — non mesurable depuis une image |
| Produits, marques, références | nulle si l'emballage n'est pas visible |
| Raison d'un choix technique | nulle |

**Deux points techniques :** les coordonnées sont souvent effacées par les applications de messagerie, donc les photos doivent passer par l'app. Et une photo réenregistrée fausse sa date : dans le doute, la durée n'est pas affichée.

### 5.6 Les questions — générées, jamais fixes

Le modèle ne devine pas ce qu'il ne voit pas. Il **demande**.

**Aucune question prédéfinie.** Après analyse, il génère uniquement celles auxquelles les photos ne répondent pas, propres à ce chantier-là. Un ravalement et une salle de bain ne produisent pas les mêmes questions.

- **2 à 4 questions maximum.** Au-delà, on retombe dans le formulaire.
- **Format bouton par défaut**, avec les réponses les plus probables déjà proposées : « Enduit gratté ou taloché ? », « À la chaux ou au ciment ? », « Combien de m² à peu près ? » avec des tranches.
- **Priorité à ce qui sert la page** : la surface, le matériau exact, la contrainte principale, la raison d'un choix technique. Jamais une question dont la réponse ne changera rien au texte.
- **Tout est facultatif.** Il saute, la page se publie sans. Ce que le modèle ne sait pas n'apparaît pas — il n'invente jamais.

**Le champ libre, toujours là, sous les questions.**

Un champ ouvert avec le micro à côté : *« Autre chose à dire sur ce chantier ? »* Il tape ou il dicte, selon l'état de ses mains. C'est là qu'il met ce que le modèle n'a pas pensé à demander.

**Ce qu'il écrit ou dicte prime sur ce que le modèle a déduit.** S'il indique « c'était de la chaux, pas du ciment », la page dit chaux. Il corrige sans avoir à chercher où.

Ses mots sont aussi repris tels quels en citation sur la page. C'est ce qui tue l'odeur d'IA mieux que tout le reste.

### 5.7 L'autorisation — réglée une fois, jamais dans le flux

**Zéro étape au moment de publier.** Aucune case, aucun SMS, aucune attente.

Tout se règle à l'inscription : l'app fournit une clause à coller une seule fois dans son modèle de devis, dans son propre logiciel. La signature du devis vaut alors autorisation d'utiliser photos et vidéos du chantier, y compris à des fins publicitaires. Il colle, c'est fini, on n'en reparle plus.

L'app n'a rien à savoir de ses devis et ne lui demande jamais rien.

**Le fond juridique, pour mémoire :**

- **Extérieur** — aucune autorisation requise. Pour l'image d'un bien, l'accord du propriétaire n'est en principe pas nécessaire ; il ne peut s'y opposer qu'en cas de trouble anormal. Façades, toitures, terrasses, portails, jardins : rien à faire, jamais.
- **Intérieur** — l'article 9 du Code civil protège le domicile au titre de la vie privée. C'est ce que couvre la clause de devis, en une fois et pour tous les chantiers à venir.

**La responsabilité éditoriale est celle de l'artisan.** Il valide chaque page avant publication, comme pour tout le reste. L'app lui donne la clause au départ ; elle ne le surveille pas ensuite.

**Retrait a posteriori :** si un particulier demande le retrait, dépublication sous 48 h. Procédure décrite dans les CGV.

### 5.8 La génération de la page

- Titre : métier + ouvrage + commune.
- Texte d'environ 250 mots dans le ton choisi en phase 1.
- Textes alternatifs de chaque photo, dictés par le contenu réel.
- Balisage `Service` et données structurées.

### 5.9 Le placement automatique dans le site existant

- La paire avant/après → page réalisation + carte de la galerie.
- Les photos de détail → illustrations dans le corps du texte.
- La réalisation → rattachée à la page prestation correspondante.
- **Si c'est la première réalisation dans cette commune, la page commune est créée.** Sinon elle est enrichie.
- Si le meilleur « après » surpasse la photo d'accueil actuelle : proposition « on remplace l'image d'accueil ? », un tap.

### 5.10 La publication — automatique

**La page part en ligne toute seule.** Il n'a aucun bouton à presser pour que ça avance.

Il reçoit une notification avec l'aperçu : « ta page du chantier de Blagnac est en ligne ». Deux actions possibles, aucune obligatoire — **modifier** ou **retirer**, en un tap, à tout moment.

Le parcours complet devient : il envoie ses photos, la page est en ligne. Un geste.

**Le garde-fou qui remplace la validation :** le modèle n'écrit que ce qu'il constate. Aucun chiffre, aucun matériau, aucune affirmation qui ne se lise sur les photos. Le risque d'erreur publique se règle par l'omission, pas par une case à cocher.

### 5.11 Quand il ne publie rien

Le mois où il ne fait rien, le site ne doit pas avoir l'air mort : les pages existantes se réorganisent, la plus performante remonte en avant. Le site reste vivant même quand lui ne l'est pas.

### 5.12 La photo qui fait preuve

Raison d'ouvrir l'app tous les jours, même quand aucun chantier n'est fini.

Chaque photo prise dans l'app conserve sa date, son heure, ses coordonnées et son auteur, sans aucune saisie. En cas de litige — dégradation imputée à tort, avancement contesté, réserve à la réception — l'artisan sort une preuve horodatée et localisée.

Un dossier de chantier se partage au client par un simple lien, sans qu'il ait à créer de compte.

**Pourquoi c'est important pour le produit :** ça donne un usage quotidien indépendant du marketing. L'app n'est pas ouverte seulement en fin de chantier ; elle l'est tous les jours. Et le stock de photos qui alimente les pages se constitue tout seul.

### 5.13 Le tableau de bord

Ce qu'il voit en ouvrant l'app. C'est ce qui justifie l'abonnement mois après mois.

**En haut, ce qui compte vraiment :** appels reçus et demandes de devis. Pas les visites. Un artisan ne se paie pas avec du trafic.

**Les chiffres, par jour, semaine, mois, avec comparaison à la période précédente :**
- appels reçus depuis le site (numéro de suivi) et depuis la fiche Google ;
- demandes envoyées par le formulaire, avec leur statut ;
- visites et pages vues ;
- part venue de Google, de la fiche, du direct, de l'annuaire ;
- les 5 pages qui rapportent le plus de contacts ;
- positions sur ses requêtes principales, suivies dans le temps ;
- apparitions et clics sur la fiche Google.

**Mesure d'audience sans cookie**, donc aucun bandeau de consentement sur les sites clients. Un site d'artisan n'a pas besoin de traqueurs.

**Chaque chantier publié est relié à ses résultats** : combien de vues, combien de contacts. C'est ce qui transforme la publication en habitude — il voit que la page de Blagnac lui a ramené trois appels.

**Une recommandation à la fois, jamais une liste.** « Tu n'as rien publié depuis 3 semaines », ou « ta fiche Google n'a pas de photo récente ». Une action, un bouton.

### 5.14 La diffusion — fiche Google, Facebook, Instagram

La vidéo et les photos sont déjà produites pour la publicité. Les diffuser coûte presque rien de plus.

**Ce que ça sert vraiment.** Ce n'est pas un canal d'acquisition : personne ne cherche un couvreur en faisant défiler un fil d'actualité. C'est un **canal de crédibilité**. Le mécanisme réel : un particulier le trouve sur Google, va vérifier sa page avant d'appeler, y voit trois chantiers récents, et appelle. Une page morte depuis deux ans fait douter. Ça se joue au moment de la décision, pas de la découverte.

**Pas de TikTok.** Audit séparé, culture de contenu différente, et surtout une audience non locale : une vidéo vue 500 000 fois à l'autre bout du pays ne produit aucun client. Écarté volontairement.

#### Les trois destinations, par valeur

| Destination | Valeur | Pourquoi |
|---|---|---|
| **Fiche Google** | la plus forte | audience locale, en intention d'achat. Plus utile que les réseaux réunis |
| **Page Facebook** | forte | là où sont les artisans français et leur réseau local, recommandation de proximité |
| **Instagram** | bonne | même intégration que Facebook, coût nul. Fort sur façade, salle de bain, cuisine, paysagisme |

#### Le flux

Chantier publié → photos et vidéo déjà prêtes → publication sur les trois destinations, avec un texte adapté à chacune.

Il valide d'un tap, ou active le mode automatique et n'y touche plus. Même mécanique que le reste du produit.

#### Ce que l'app ne peut pas faire : créer les comptes

**Aucune API ne crée de compte social**, et c'est interdit par les conditions de toutes les plateformes. L'artisan les crée lui-même.

Pour Instagram, il devra en plus convertir en compte professionnel et le lier à une Page Facebook — exigence Meta qu'aucun tiers ne peut contourner.

**Ce que l'app fait à la place :** elle le guide écran par écran à l'inscription, une fois, en cinq minutes. Puis elle connecte les comptes et il n'y revient jamais.

#### Contraintes techniques et délais

- **Meta (Facebook Page + Instagram)** : une seule intégration. Compte Business, Page, compte professionnel lié, application développeur, permission `instagram_business_content_publish` validée. **Revue Meta : 2 à 4 semaines par soumission.** Lente mais prévisible.
- **Fiche Google** : dépend de l'accès à l'API Business Profile, sous approbation (section 11). Sans cet accès, l'app prépare la publication et l'ouvre dans la fiche en deux taps.
- **Dépréciations Meta** : versions de l'API dépréciées selon un calendrier fixe. Charge de maintenance récurrente à prévoir.
- **Raccourci possible :** des API unifiées détiennent déjà les approbations Meta. Publication par un seul point d'entrée, sans passer les revues soi-même, sans maintenir les dépréciations. Coût à l'usage, mais plusieurs mois d'attente supprimés. **À privilégier au lancement**, quitte à internaliser plus tard.

---

### 5.15 Plusieurs personnes sur le terrain

Une entreprise de cinq salariés, ce sont cinq téléphones qui photographient. C'est le cas standard, pas une exception.

- **Un compte entreprise, plusieurs membres.** Invitation par code, aucune création de compte compliquée.
- **Trois rôles suffisent :** gérant (voit tout, publie), équipe (photographie et dicte), sous-traitant (accès au seul chantier qui le concerne).
- **Chaque photo porte son auteur.** Utile pour retrouver qui était où, et pour le suivi.
- **Seul le gérant publie.** Les autres alimentent.
- **Facturation par entreprise, pas par tête.** L'artisan seul et l'entreprise de six paient pareil. C'est un argument direct contre les tarifs par utilisateur du marché.

---

## 6. Le site produit

### 6.1 Architecture

- Accueil
- Une page par prestation
- **Page réalisations** — la liste de tous les chantiers en vignettes, avec pour chacune la photo mise en avant
- **Une page par chantier** — photo mise en avant, galerie du chantier, avant/après, texte, commune. Le cœur du site, alimenté en continu
- Une page par commune — voir règle ci-dessous
- Contact, mentions légales, avis

Structure de portfolio classique : on liste, on clique, on arrive sur le chantier. Rien à inventer.

### 6.2 Règle absolue sur les pages communes

**Pas de page ville sans au moins une réalisation réelle dessus.** Elle naît le jour où un chantier de cette commune est publié — à la création comme plus tard. Jamais générée depuis la seule zone d'intervention.

Une page de service par ville, générée par gabarit avec seulement le nom de la commune qui change, c'est exactement le motif que Google sanctionne au titre du contenu produit à grande échelle. Créer plusieurs sites pour masquer la nature industrielle de la génération est explicitement interdit, avec détection des motifs entre domaines.

Le produit tient debout précisément parce que chaque page décrit un ouvrage distinct et vérifiable.

### 6.3 Technique

- Génération statique (Astro ou Next SSG). HTML réel servi, pas d'injection JavaScript.
- Images en AVIF/WebP, `srcset` responsive.
- LCP sous 1,2 s en 4G.
- Données structurées `LocalBusiness`, `Service`, `ImageObject`.
- `sitemap.xml`, `robots.txt`, canonicals, Search Console connectée.
- Régénération incrémentale : publier une réalisation ne reconstruit que les pages concernées.

### 6.4 Design — niveau agence

Le site final doit être indiscernable d'un site fait par une agence à 5 000 €. C'est le critère de sortie, pas un objectif.

#### Interdictions absolues — ce qui trahit un site généré

Un site vibecodé se repère avant même d'avoir lu une ligne. Ces éléments sont bannis du système, aucune exception :

- dégradé violet-bleu en fond de section ;
- Inter, Poppins, Montserrat en typo principale ;
- trois cartes alignées avec icône ronde, titre, deux lignes de texte ;
- coins arrondis uniformes et ombres portées douces appliqués à tout ;
- hero centré : gros titre, sous-titre gris, deux boutons côte à côte ;
- jeux d'icônes reconnaissables (Lucide, Heroicons, Feather) ;
- emoji dans un titre de section ;
- badge « ✨ Nouveau » ou équivalent ;
- rythme vertical identique d'une section à l'autre ;
- toutes les images au même format et aux mêmes marges ;
- pied de page en quatre colonnes avec des liens qui ne mènent nulle part.

#### Ce qui fait le contraire

- photos en pleine largeur, débordant en bord d'écran ;
- tailles d'images volontairement irrégulières ;
- typographie à fort contraste, avec une vraie serif quelque part ;
- blancs asymétriques, rythme vertical qui varie d'une section à l'autre ;
- jamais de carte à icône.

#### Le système — 20 templates, 20 palettes

**20 templates dessinés et validés un par un.** Ce sont des mises en page réellement différentes : photo pleine page, grille serrée, éditorial, magazine, colonne unique, asymétrique, séquentiel. Pas le même modèle décliné.

**20 palettes** construites une par une, chacune testée sur plusieurs templates. Certaines dérivées de la matière des métiers — pierre, bois, métal, enduit, végétal — d'autres plus franches.

**10 couples typographiques**, aucun issu des polices par défaut listées plus haut. Chaque template n'en accepte que 3 ou 4, ceux qui fonctionnent avec lui.

400 combinaisons de base, avant même les variations. C'est largement suffisant : ce qui distingue vraiment deux sites, ce sont les photos et les textes, pas la grille.

**Chaque template est relu et approuvé une fois pour toutes.** C'est ce qui garantit qu'aucun site laid ne peut sortir — contrairement à un système génératif dont on ne sait jamais à quoi ressemblera la prochaine production.

**L'IA compose par-dessus :** elle choisit le template et la palette selon le métier, la matière dominante des photos et le ton retenu, puis ajuste l'ordre des sections, la densité et le traitement des images.

#### Les couleurs — il choisit

Au départ, le système propose une palette extraite de ses propres photos de chantier, et une palette dérivée de son logo. **Ce sont des propositions, jamais des contraintes.**

Il peut à tout moment : prendre une palette métier prédéfinie, saisir ses propres couleurs, reprendre celles de son logo, ou tout changer plus tard. Le site se recompose sans perdre le contenu.

#### L'unicité — mémoire des attributions

**Sans mémoire, l'IA repique les mêmes combinaisons.** Il faut une table des attributions, et c'est tout.

- Chaque couple template + palette attribué est enregistré avec le métier et le département du client.
- **Règle stricte : deux artisans du même métier dans le même département n'ont jamais le même template.** C'est le seul cas où la ressemblance se verrait, puisque ce sont des concurrents directs sur les mêmes recherches.
- Ailleurs, l'IA s'écarte simplement des combinaisons les plus utilisées.
- Les photos font le reste : deux artisans n'ont jamais les mêmes chantiers.

**Contrainte :** chaque template doit tenir aussi bien avec 3 chantiers qu'avec 60.

### 6.5 Les textes — la vraie source de l'odeur d'IA

L'odeur ne vient pas du design, elle vient du texte. Règles non négociables :

**Interdit :**
- toute phrase ne contenant aucune donnée saisie ;
- le lexique mort : « fort de », « savoir-faire », « à votre écoute », « n'hésitez pas », « que ce soit… ou… », « sur-mesure », « passion du métier », « professionnels qualifiés » ;
- les tirets cadratins en incise, les énumérations par trois, les formules « non pas X, mais Y » ;
- la même longueur de texte d'un site à l'autre.

**Obligatoire :**
- chaque phrase porte un fait : surface, matériau, durée, contrainte, commune. « Enduit gratté sur 180 m², façade nord, support fissuré traité avant application, 6 jours » ne sent pas l'IA — ça sent le façadier ;
- **la dictée de l'artisan est reprise telle quelle** en citation sur la page du chantier. Ses mots, sa syntaxe. C'est l'arme anti-IA la plus efficace du produit ;
- longueur, rythme et vocabulaire variables selon le ton choisi et le métier ;
- relecture humaine avant mise en ligne.

### 6.6 Le logo — généré dans l'app

Beaucoup d'artisans n'en ont pas, et c'est bloquant pour le site. Le générateur fait partie du produit.

**Sortie en SVG vectoriel, jamais en image pixel.** Un logo flou en PNG ruine tout le reste du travail. En SVG il reste net partout : site, favicon, devis, panneau de chantier, camion.

**Méthode.** Le modèle génère du **code SVG** à partir des données déjà saisies — métier, nom, ton choisi. Pas de génération d'image : les générateurs pixel produisent des contours qui bavent et du texte déformé. Le SVG donne des formes géométriques propres et nettes à toutes les tailles.

Il voit plusieurs propositions, il choisit, il ajuste les couleurs, il regénère autant qu'il veut.

**Deux garde-fous non négociables :**

1. **Le texte n'est jamais généré.** Le nom de l'entreprise est composé dans une vraie typo du système, contrôlée. C'est le seul moyen d'éviter les lettres tordues qui trahissent la génération.
2. **Filtrage automatique avant affichage.** Trop de points d'ancrage, formes qui se chevauchent, contraste insuffisant, symbole illisible en 32 px : rejeté. Il ne voit jamais une proposition ratée.

**S'il a déjà un logo**, il l'envoie. Si c'est un JPG ou un PNG, il est vectorisé et nettoyé.

**Une seule source, déclinée automatiquement :** favicon, en-tête de site, en-tête de devis, carte de visite, panneau de chantier. Versions couleur, monochrome et négatif générées à partir du même fichier.

### 6.7 Propriété

Nom de domaine au nom de l'artisan, transférable à tout moment. Argument frontal contre les contrats de 4 ans du marché.

---

### 6.8 Le formulaire de contact — le point de conversion

Le SEO amène du monde. C'est ici que ça devient un client. Rien n'est plus important sur le site.

**Champs, et rien de plus :** nom, téléphone, commune, type de travaux (boutons issus de ses prestations), description libre.

**Le prospect peut joindre des photos.** Déterminant en bâtiment : l'artisan chiffre ou écarte sans se déplacer. Aucun concurrent ne le propose.

**Bouton d'appel fixe en bas d'écran sur mobile.** La majorité appellera au lieu d'écrire. Il ne doit jamais avoir à chercher le numéro.

**Notification immédiate par SMS et push, pas par e-mail.** Un artisan sur un chantier ne lit pas ses mails. Chaque heure de délai réduit ses chances de signer.

**Anti-spam invisible :** champ piège et limitation de débit. Jamais de captcha, ça fait chuter les envois.

**Suivi dans l'app :** liste des demandes avec statut — nouvelle, rappelée, devis envoyé, signée, perdue. C'est aussi ce qui alimente le rapport mensuel et prouve la valeur de l'abonnement.

### 6.9 Le rappel automatique sur appel manqué

Un artisan sur un toit avec des gants ne décroche pas. L'appel manqué, c'est le client perdu : il appelle le suivant dans la minute.

Le numéro de suivi existe déjà dans l'architecture, donc l'appel manqué est détecté sans rien ajouter.

- **SMS automatique dans les 30 secondes** : « Désolé, je suis sur chantier. Je vous rappelle en fin de journée. » Texte modifiable une fois, jamais ensuite.
- **Notification à l'artisan** avec le numéro et l'heure, rappel en un tap.
- **L'appel manqué remonte comme une demande** dans la liste, avec son statut, au même titre qu'un formulaire.
- **Plages horaires réglables** : pas de SMS à 23 h.

Coût quasi nul, effet direct et mesurable dans le tableau de bord.

### 6.10 L'accusé de réception et la réponse pré-rédigée

63 % des artisans consultent leurs mails tous les jours pendant leurs congés, par peur de perdre un chantier. Le produit doit supprimer cette peur, pas l'entretenir.

- **Le prospect reçoit une confirmation immédiate** : demande bien reçue, délai de réponse annoncé.
- **L'artisan reçoit une réponse déjà écrite**, construite à partir de la demande : la prestation évoquée, la commune, ce qu'il faut préciser. Il l'envoie d'un tap ou la modifie.
- **Relance automatique du prospect** à 5 jours s'il n'a pas donné suite.

### 6.11 La qualification avant déplacement

Le premier problème du secteur n'est pas le manque de demandes, c'est le devis qui n'aboutit pas : des déplacements et des heures de chiffrage pour rien.

Trois champs supplémentaires au formulaire (6.8), tous en boutons :

- **budget approximatif**, par tranches ;
- **délai souhaité** : dès que possible, dans 3 mois, je me renseigne ;
- **statut** : propriétaire, locataire, syndic.

Ça ne fait pas fuir : ça trie. Une demande « je me renseigne, locataire » n'a pas la même valeur qu'une demande « propriétaire, dès que possible », et l'artisan le voit avant de prendre sa voiture.

Le tri s'affiche dans la liste des demandes, sans jamais en écarter aucune.

### 6.12 Le simulateur d'aides

**La fonction la plus forte de cette série.**

79 % des artisans jugent MaPrimeRénov' déterminante pour leurs clients, mais 51 % perdent un temps important à chercher les critères d'éligibilité. Chez ceux qui n'y recourent pas, 91 % citent la surcharge administrative et 83 % la complexité des dossiers.

**Sur le site de l'artisan**, une page dédiée : le particulier indique sa tranche de revenus, son type de logement et les travaux envisagés, et obtient une estimation des aides mobilisables — MaPrimeRénov', CEE, TVA réduite.

**Deux effets en un :**

- **Référencement** : les recherches sur les aides à la rénovation représentent un volume considérable, et aucun site d'artisan ne les capte.
- **Conversion** : le visiteur hésitant qui découvre qu'il a droit à une aide devient une demande de devis. Le formulaire est au bout du simulateur.

**Contraintes :**

- Les barèmes changent souvent. Ils sont centralisés côté plateforme et mis à jour une fois pour tous les sites clients — jamais saisis par l'artisan.
- **Estimation, jamais engagement.** Mention explicite, et renvoi vers France Rénov' pour la démarche officielle.
- Le simulateur n'apparaît que chez les artisans dont le métier est concerné, et son badge RGE s'affiche à côté quand il l'a.

### 6.13 Le simulateur de tarifs — optionnel

Les recherches du type « prix ravalement au m² » ou « tarif rénovation salle de bain » représentent un volume considérable, et aucun site d'artisan ne les capte. C'est le même double effet que le simulateur d'aides : du référencement et de la conversion.

**Optionnel, et désactivé par défaut.** Beaucoup d'artisans refusent d'afficher leurs prix, et c'est leur droit. Il l'active s'il le veut, dans les réglages.

#### Ce qu'il saisit, une fois

Ses prix par prestation, dans les unités de son métier : au m², au mètre linéaire, au point, à la journée, au forfait.

Plus les majorations habituelles, en pourcentage : étage sans ascenseur, accès difficile, travail en hauteur, support à reprendre, chantier occupé.

#### Ce que voit le visiteur

Quelques boutons — type de travaux, surface, contraintes — puis **une fourchette, jamais un prix unique.**

« Entre 45 et 65 € du m² » est crédible et n'enferme personne. Un prix unique ferait fuir sur le haut et poserait problème sur le bas, puisque l'état du support, l'accès et la hauteur ne se voient pas depuis un écran.

#### Les garde-fous

- **Estimation, jamais devis.** Mention explicite sur l'écran de résultat, et clause dans les CGV. Un prix affiché qui engage sur un chantier non vu, c'est un litige.
- Aucun prix n'est stocké ni comparé entre artisans, ni affiché ailleurs que sur son propre site.

#### Ce qui compte vraiment : la suite

Le résultat n'est pas une fin, c'est le début du formulaire.

Sous la fourchette, un bouton « demander un devis précis », avec **les réponses déjà reportées** : type de travaux, surface, contraintes. La demande arrive qualifiée, l'artisan sait déjà de quoi il s'agit.

### 6.14 La prise de rendez-vous

Placée juste après le simulateur et le formulaire : le visiteur qui vient de voir son estimation est au maximum de son intention.

**Pas de créneaux à la minute.** Un artisan ne tient pas d'agenda partagé et n'en tiendra jamais. Le bon niveau est la demi-journée.

- Il coche ses **disponibilités type** une fois : mardi et jeudi matin, par exemple.
- Le visiteur choisit un créneau et laisse ses coordonnées.
- **Rien n'est bloqué tant que l'artisan n'a pas répondu.** Il reçoit un SMS, il confirme d'un tap ou propose autre chose.

C'est la condition pour que la fonction survive : un rendez-vous imposé au milieu d'un chantier, et il la coupe.

- Le rendez-vous entre dans la liste des demandes, avec son statut.
- **Rappel automatique au client la veille** — les visites pour rien sont l'autre plaie du métier.

---

## 7. Le SEO — le cœur de la promesse

L'artisan n'achète pas un site. Il achète des appels. Tout ce qui suit sert cet objectif.

### 7.1 L'avantage structurel

Le site d'un concurrent est figé le jour de sa livraison et ne bouge plus pendant quatre ans. Celui-ci publie 2 à 6 pages réelles par mois, chacune décrivant un ouvrage distinct, localisé, photographié.

**C'est le seul avantage que la concurrence ne peut pas rattraper en achetant une prestation.** Il faut du travail réel pour l'alimenter.

### 7.2 Les pages de chantier — l'arme principale

Chaque page porte ce que personne d'autre n'a : des photos originales, une surface, des matériaux, une durée, une contrainte rencontrée, une commune. C'est du contenu impossible à dupliquer et impossible à confondre avec de la génération de masse.

Le maillage se fait dans les trois sens : chantier ↔ prestation ↔ commune. Chaque nouvelle page renforce les deux autres.

### 7.3 Les images — le gisement que personne n'exploite

Les photos de chantier sont des images originales et uniques. « Rénovation salle de bain avant après » est massivement cherché dans Google Images, et les sites d'artisans y sont quasi absents.

- Noms de fichiers construits : `ravalement-enduit-gratte-blagnac-avant.avif`
- Textes alternatifs issus des données réelles, jamais génériques
- Balisage `ImageObject` avec légende, lieu et date
- Dimensions déclarées, formats modernes, chargement différé
- Géolocalisation conservée dans les données structurées
- Sitemap images séparé

### 7.4 La cohérence avec la fiche Google

Les signaux de la fiche d'établissement pèsent environ 32 % du classement dans le pack local, l'on-page environ 19 %, les avis 16 à 20 %. Et un site qui contredit la fiche voit ses signaux filtrés.

Le produit garantit la cohérence : mêmes nom, adresse, téléphone, mêmes prestations, même zone déclarée des deux côtés. L'app détecte les écarts et alerte.

Elle guide aussi la configuration : établissement de zone de chalandise avec adresse masquée, catégorie principale et catégories secondaires, liste des services réels. C'est là que la majorité des artisans se trompent.

### 7.5 Les avis

Ce n'est pas le volume qui compte, mais la fraîcheur, le détail et la régularité.

**Demander un avis.** L'app ne détient pas les coordonnées du particulier et n'a pas à les détenir. Quand un chantier est publié, elle prépare le message et le lien direct vers sa fiche Google, et il l'envoie **lui-même depuis son téléphone**, par SMS ou WhatsApp, en un tap. Rien à stocker, aucune donnée de tiers, aucune friction.

**Répondre aux avis.** Les avis remontent dans l'app. Pour chacun, une réponse est rédigée à partir de l'avis et du chantier concerné. Il valide d'un tap, ou active le mode automatique et n'y touche plus.

Un bouton sur son site permet aussi de laisser un avis directement.

**Réserve technique :** lire et répondre aux avis passe par l'API fiche d'établissement, qui est sous approbation Google (voir section 11). Sans cet accès, l'app affiche l'avis et ouvre la fiche pour qu'il réponde en deux taps. Le produit fonctionne dans les deux cas.

**Affichage sur le site** avec le balisage adapté, et rattachement de l'avis à la page du chantier correspondant.

### 7.6 Les réponses génératives

Google a étendu ses règles aux AI Overviews et à l'AI Mode, publié un guide dédié en mai 2026, et ajouté le suivi des performances génératives dans la Search Console en juin 2026.

Ce qui se fait citer par ces réponses, ce sont des affirmations factuelles nettes : prix constatés, durées réelles, contraintes techniques, réponses directes à des questions précises. Exactement la matière que produit le questionnaire chantier.

Concrètement : phrases autoportantes, entité claire et cohérente, questions fréquentes construites à partir des vraies données de ses chantiers, pas des formules creuses.

### 7.7 Le socle technique

- HTML réel servi en statique, jamais de contenu injecté en JavaScript
- LCP sous 1,2 s en 4G — un site à 0,8 s face à trois concurrents à 4 s, ça se voit au classement
- `LocalBusiness`, `Service`, `ImageObject`, `FAQPage`, `Review`
- Sitemaps, canonicals, robots, Search Console connectée à la publication
- Régénération incrémentale : publier un chantier ne reconstruit que les pages concernées

### 7.8 La preuve

Numéro de suivi d'appel, formulaires tracés, rapport mensuel d'une page : appels, demandes de devis, part venue de Google, positions gagnées.

La critique numéro un des acteurs en place, c'est que le client ne sait jamais si ça marche.

### 7.9 Ce que le produit ne promet pas

Aucun outil ne peut garantir une position : c'est Google qui classe, selon la concurrence du secteur et de la zone. Le produit ne fabrique pas non plus de liens entrants.

Ce qu'il garantit, c'est un site qui produit chaque mois du contenu réel que ses concurrents n'ont pas. Sur la durée, dans un secteur local, c'est ce qui fait la différence.

---

## 8. Les briques françaises

Ce que ne fera jamais correctement un outil étranger, et qui constitue la barrière métier :

- **RGE** — base publique des professionnels certifiés, branchée, badge vérifié affiché automatiquement. Premier filtre du particulier qui rénove.
- **Décennale** — assureur, numéro de contrat, zone de couverture.
- **Aides** — MaPrimeRénov', CEE. Un chantier d'isolation avec l'aide mobilisée mentionnée, c'est exactement ce que le particulier tape dans Google.
- **TVA 5,5 / 10 / 20** — déduite de la nature des travaux déclarée, alimente le contenu.
- **Vocabulaire métier réel** — enduit gratté ou taloché, R d'isolation, DTU applicable. C'est ce qui fait qu'un texte sonne juste.
- **Granularité communale** — 32 659 communes, la recherche se fait en « métier + ville ».

---

## 9. L'annuaire public — le fossé

Un annuaire de chantiers réalisés, commune par commune, métier par métier, alimenté par tous les clients. Hébergé sur le domaine de la plateforme.

**Son rôle est unique : amener le particulier sur le site de l'artisan.**

Quelqu'un cherche « ravalement de façade à Blagnac », tombe sur l'annuaire, voit trois chantiers réels, clique et arrive sur le site de l'artisan concerné. L'annuaire ne retient personne et ne vend rien.

**Ce qu'il affiche :** une vignette par chantier — la photo mise en avant, le métier, la commune, la date — et un lien. **Jamais le texte de la page.**

Raison technique : un même texte publié à deux adresses différentes en fait ignorer une par Google, et ce serait celle de l'artisan qui perdrait, l'annuaire étant plus fort. Donc la page complète reste chez lui, l'annuaire n'en montre qu'un aperçu et pointe vers lui.

**L'ordre d'affichage est objectif** : proximité, nombre de chantiers publiés, fraîcheur de la publication. Jamais payant. Ça évite toute contestation entre clients d'une même ville.

**Pourquoi c'est le seul vrai fossé :** un annuaire d'entreprises se télécharge depuis les données Sirene en une après-midi. Un annuaire de chantiers photographiés ne se scrape pas, ne s'achète pas, s'accumule chantier par chantier.

**Effet de réseau :** un nouvel inscrit reçoit des demandes dès la première semaine, sans attendre les 6 mois que met son propre site à se classer. Chaque artisan qui rejoint rend l'annuaire plus attirant pour le suivant.

**Modération :** entreprise radiée au répertoire Sirene ou abonnement résilié, la fiche sort de l'annuaire. Signalement de photo, retrait sous 48 h.

---

## 10. Ce que le produit ne fait pas

- Pas de devis ni de facture
- Pas de gestion de chantier, de planning ni de rentabilité
- Pas d'e-commerce
- Pas de publicité payante
- Pas d'articles de blog générés en masse

Une seule promesse : un site tout de suite, qui grossit avec les chantiers et ramène des clients.

---

## 11. Contraintes techniques à respecter

**API Google Places — inutilisable pour le contenu du site.** Interdiction de pré-charger, indexer, stocker ou mettre en cache le contenu ; seul le `place_id` est exempté. Le nom d'une photo ne peut pas être mis en cache et peut expirer. Tout affichage impose le logo Google et les attributions d'auteur.

→ **Toutes les photos du site viennent de l'artisan. Aucune photo Google, aucune banque d'images.** C'est le principe même du produit.

**API Google Business Profile — sous approbation.** Demande validée manuellement par Google, fiche vérifiée active depuis plus de 60 jours, site professionnel valide exigé. Refus fréquents, quotas de départ faibles.

→ **La publication automatique sur la fiche Google est en V2, jamais en dépendance de V1.**

---

## 12. Modèle économique

| | |
|---|---|
| Prix | 69 à 89 € HT/mois |
| Engagement | aucun |
| Frais de création | offerts |
| Inclus | site, hébergement, domaine au nom du client, app, pages illimitées |

Valeur vie estimée 1 200 à 2 000 €, ce qui autorise un coût d'acquisition de 300 à 500 € — donc vente en démo, terrain, publicité possible.

**Positionnement :** au-dessus des offres génériques à 15 €/mois (trop pauvres pour cette cible), en dessous des contrats agence à 100-250 €/mois sur 4 ans (4 800 à 15 000 € au total, très mal vécus).

**Ce qui gagne les renouvellements :** un rapport d'une page tous les mois — appels, demandes de devis, part venue de Google. La critique numéro un des acteurs en place, c'est que le client ne sait jamais si ça marche.

---

## 13. Parcours client et onboarding

Le produit se joue dans les dix premières minutes. Un artisan qui décroche à l'écran 3 ne revient pas.

- **Aucun moyen de paiement demandé à l'inscription.** Il voit son site en entier avant de décider. 30 jours.
- **Progression sauvegardée à chaque écran**, reprise là où il s'est arrêté, sur n'importe quel appareil.
- **Une action par écran.** Jamais deux décisions en même temps.
- **Barre d'avancement visible** : il sait toujours combien il reste.
- **Résultat montré tôt** : dès le SIRET saisi, il voit une première maquette avec son nom dedans. C'est ce qui donne envie de continuer.
- **Relance s'il abandonne** : à 1 h, à 24 h, à 3 jours. Puis stop.
- **Premier chantier publié accompagné** : appel ou visio de 20 minutes. C'est le moment où il comprend le produit, et le meilleur investissement anti-résiliation.
- **Liste de démarrage après publication** : fiche Google vérifiée, premiers avis demandés, numéro affiché.

---

## 14. Paiement, résiliation, sortie

**Paiement.** Prestataire type Stripe. Carte ou prélèvement SEPA. Mensuel, sans engagement. Facture automatique conforme, en Factur-X.

**Échec de paiement.** Relance automatique à J+1, J+3, J+7. Bandeau dans l'app. **Le site reste en ligne pendant 30 jours** — on ne coupe pas la vitrine d'une entreprise sans préavis. Suspension au 31e jour, avec page de maintenance sobre, jamais une page d'erreur. Suppression des données à 90 jours.

**Résiliation.** En deux clics dans l'app, effet à la fin de la période payée. Aucun appel obligatoire, aucun courrier recommandé. C'est l'inverse exact des contrats de 4 ans du marché, et ça devient un argument de vente.

**Ce qu'il emporte, et c'est écrit dès le premier jour :**

- **Le domaine est à lui.** Il choisit : il le garde, ou il nous le cède gratuitement. Son choix, pas le nôtre.
- **Archive complète** livrée sous 7 jours : toutes ses photos en pleine résolution, tous les textes, le logo en SVG, la liste des demandes de contact reçues. Format ouvert, exploitable ailleurs.
- **Redirections maintenues 6 mois** s'il repart avec son domaine, pour ne pas casser son référencement.

Rien de tout ça n'est un geste commercial. C'est la contrepartie du positionnement, et ça doit être dans les CGV.

---

## 15. RGPD et conformité

Le produit stocke des photos de l'intérieur de domiciles privés et des numéros de téléphone de particuliers. C'est du sérieux.

- **Registre des traitements** tenu à jour. Trois traitements : clients artisans, particuliers photographiés, prospects du formulaire.
- **Bases légales** : contrat pour l'artisan, intérêt légitime pour les photos d'extérieur, consentement pour les photos d'intérieur — recueilli par l'artisan via la clause de son devis, en dehors de la plateforme.
- **Hébergement en France ou dans l'Union européenne**, y compris le stockage des photos. C'est aussi un argument commercial.
- **Sous-traitants listés** avec leurs contrats : hébergeur, paiement, SMS, modèles d'IA, téléphonie.
- **Durées de conservation** : photos tant que l'abonnement court, plus 90 jours ; demandes de contact 3 ans ; signalements de retrait 3 ans.
- **Droits** : accès, rectification, suppression, portabilité — traités en 30 jours, via un formulaire dédié.
- **Retrait du consentement** : si un particulier se rétracte, ses photos sont dépubliées sous 48 h. L'app alerte l'artisan.
- **Cookies** : mesure d'audience sans cookie, exemptée de bandeau. Un site d'artisan n'a pas besoin de traqueurs.
- **Politique de confidentialité et mentions légales** générées automatiquement sur chaque site client.

---

## 16. CGV et responsabilité

- **L'artisan est responsable du contenu qu'il publie** — c'est lui qui valide chaque page. Rappelé au moment de la publication.
- **Autorisation des photos** : la clause de devis est fournie à l'inscription. L'artisan reste responsable de ce qu'il publie ; la plateforme dépublie sur signalement sous 48 h.
- **Le simulateur de tarifs ne vaut pas devis** : estimation indicative, sans engagement sur le prix final. Clause obligatoire et mention affichée sur l'écran de résultat.
- **Aucune garantie de position** sur Google. Écrit noir sur blanc, dans les CGV comme sur le site commercial.
- **Textes générés** : publiés automatiquement à partir des seuls éléments constatés sur les photos, modifiables et retirables à tout moment par l'artisan. La responsabilité éditoriale est la sienne.
- **Disponibilité** : objectif 99,5 %. Interruption planifiée annoncée 48 h avant.
- **Propriété** : contenus, photos et logo appartiennent à l'artisan. Le code de la plateforme reste la propriété de l'éditeur.
- **Médiation de la consommation** : obligatoire en France pour une vente aux professionnels par voie électronique. Médiateur désigné et mentionné.

---

## 17. Support

À 79 €/mois, le support est un poste de coût, pas une promesse illimitée.

- **Canal principal : chat dans l'app**, du lundi au vendredi, 8 h à 18 h. Réponse sous 4 h ouvrées.
- **Téléphone** pour les urgences réelles : site inaccessible, erreur sur une page publiée.
- **Astreinte week-end** limitée au site hors ligne. Le reste attend lundi.
- **Base d'aide en vidéos courtes**, filmées dans l'app. Un artisan regarde, il ne lit pas.
- **Accompagnement au premier chantier** inclus, une fois.

Objectif : moins de 15 minutes de support par client et par mois en régime stable. Au-delà, c'est le produit qui est en cause, pas le client.

---

## 18. Coûts unitaires et rentabilité

### Coût technique par client et par mois

Base de calcul : 5 chantiers publiés par mois, 10 photos par chantier, 1 500 visites mensuelles.

| Poste | Détail | Coût |
|---|---|---|
| Stockage photos | ~500 Mo, stockage objet sans frais de sortie | 0,02 € |
| Traitement images | 50 photos, redimensionnement et encodage AVIF | 0,05 € |
| Analyse par modèle de vision | 5 chantiers, 10 photos chacun, extraction structurée | 1,80 € |
| Alignement avant/après | calcul local, OpenCV | 0,01 € |
| Génération de textes | 5 pages + ajustements | 0,15 € |
| Transcription des dictées | 5 × 30 s | 0,02 € |
| Numéro de suivi d'appel | abonnement + ~60 min | 3,00 € |
| Hébergement et diffusion | statique, régénération incrémentale | 0,50 € |
| Publication sur les réseaux | API unifiée, ~15 publications | 0,80 € |
| SMS : appels manqués et rappels de rendez-vous | ~12 par mois | 0,54 € |
| Nom de domaine .fr | ~9 €/an | 0,75 € |
| **Total technique** | | **≈ 7,66 €** |

Le poste qui dérape si on n'y prend pas garde, c'est le stockage photo sur plusieurs années. Choisir un stockage objet sans frais de sortie règle le problème dès le départ.

### Coût humain

| Poste | Charge | Coût à 30 €/h chargé |
|---|---|---|
| Onboarding et 1er chantier accompagné | 45 min, une fois | 22 € au démarrage |
| Contrôle par sondage des pages publiées | 5 min | 2,50 €/mois |
| Support | 15 min | 7,50 €/mois |
| **Total récurrent** | | **10 €/mois** |

### Marge

| | 79 € HT/mois |
|---|---|
| Coût technique | −7,66 € |
| Coût humain | −10 € |
| **Marge contributive** | **58,84 € (74 %)** |

### Rentabilité

- **Coût d'acquisition visé :** 300 à 500 €, plus 22 € d'onboarding.
- **Amortissement :** 5 à 8 mois d'abonnement.
- **Durée de vie estimée 24 mois** → 1 896 € encaissés, environ 1 480 € de marge.
- **Rapport valeur vie / coût d'acquisition : 3 à 5.** Sain. En dessous de 3, le modèle ne tient pas.

| Clients | Revenu mensuel | Marge contributive |
|---|---|---|
| 25 | 1 975 € | 1 540 € |
| 50 | 3 950 € | 3 080 € |
| 100 | 7 900 € | 6 165 € |
| 250 | 19 750 € | 15 410 € |

**Le seuil qui compte n'est pas le point mort technique — il est atteint très vite. C'est le moment où le support et la relecture dépassent une personne seule : autour de 120 à 150 clients.** C'est là qu'il faut soit recruter, soit avoir réduit la relecture humaine.

### Les paliers

Trois niveaux. Le passage de l'un à l'autre est proposé dans le tableau de bord, au moment où le chiffre le justifie — jamais en pop-up permanent.

| | Essentiel | Visibilité | Croissance |
|---|---|---|---|
| Prix | 79 € HT/mois | 129 € HT/mois | 249 € HT/mois + budget publicitaire |
| Site, app, chantiers illimités | oui | oui | oui |
| Suivi d'appels et tableau de bord | oui | oui | oui |
| Communes | pages créées par ses chantiers | idem, plus travail éditorial sur les communes où il a déjà publié | idem |
| Mise en avant dans l'annuaire | non | oui | oui |
| Suivi de positions | 10 requêtes | 40 requêtes | illimité |
| Photos professionnelles | non | 1 reportage par an | 2 par an |
| Publicité pilotée | non | non | oui |

Le palier Visibilité est du produit pur. Le palier Croissance l'est aussi **à condition que la chaîne publicitaire soit entièrement automatisée** — c'est l'objet des deux sections suivantes.

### L'option publicité — automatisée de bout en bout

**Règle absolue : le budget publicitaire ne transite jamais par la plateforme.**

Le client crée son compte Google Ads, il paie Google directement avec sa propre carte, et la plateforme prend un **accès gestionnaire** via un compte administrateur. Facturer le client puis payer Google reviendrait à avancer 500 à 1 500 € par client et par mois — la trésorerie ne le supporte pas, et en cas d'impayé la perte est sèche.

#### Pourquoi les LSA d'abord

Disponibles en France depuis 2019, encore peu utilisées par les artisans. Facturation **au contact reçu, pas au clic**. Position au-dessus des annonces classiques, badge Google Vérifié, bouton d'appel direct.

Surtout : **il n'y a presque rien à optimiser, par construction.** Pas de mots-clés, pas d'annonces à rédiger, pas de visuels. On déclare les services, la zone et le budget hebdomadaire, Google fait le reste à partir de la fiche d'établissement — services, zone, avis, photos. Or c'est exactement ce que le produit tient déjà à jour.

C'est le seul format publicitaire réellement automatisable pour un artisan.

#### La chaîne automatique

| Étape | Automatisation |
|---|---|
| Création de campagne, budgets, zones, services | API Google Ads, à partir des données déjà saisies |
| Visuels et vidéos | générés depuis les chantiers publiés (voir plus bas) |
| Textes d'annonce | générés depuis les données de chantier : ouvrage, commune, matériaux |
| Suivi des conversions | appels du numéro de suivi et envois de formulaire remontés automatiquement |
| Arbitrage budgétaire | règles automatiques, pas de décision humaine |
| Rapport client | intégré au tableau de bord, temps réel |

#### Les règles d'arbitrage — remplacent le pilotage humain

Écrites une fois, appliquées à tous les comptes :

- coût par contact au-dessus du seuil du métier pendant 7 jours → budget réduit de moitié, alerte ;
- au-dessus pendant 14 jours → campagne mise en pause, client prévenu ;
- zéro contact en 10 jours avec budget consommé → pause automatique ;
- plafond de dépense quotidien codé en dur, jamais dépassable ;
- contact en double ou hors zone → contestation automatique auprès de Google, avec les preuves ;
- performance par commune comparée chaque semaine, redistribution du budget vers celles qui convertissent.

**Le plafond de dépense en dur est la protection essentielle.** Un système automatique qui brûle l'argent d'un client, c'est un litige et une réputation détruite.

#### Ce qui reste manuel — et ce n'est pas négociable

À dire clairement plutôt que de le découvrir en route :

1. **L'accès à l'API Google Ads.** Quatre niveaux : Test, Explorer, Basic, Standard. **L'accès Basic suffit** — 15 000 opérations par jour, assez pour plusieurs centaines de comptes. Il s'obtient sur dossier, avec un délai pouvant atteindre plusieurs semaines. La vérification de marque du projet Google Cloud accélère l'examen. **Ne pas demander l'accès Standard :** il déclenche l'audit « Required Minimum Functionality », qui impose de construire une interface complète de gestion de campagnes, avec des frais en cas de non-conformité. C'est une dépendance à lancer très en amont.
2. **La vérification Google Garanti** pour les LSA : contrôle de l'assurance et des qualifications, entreprise par entreprise. L'app pré-remplit tout ce qu'elle détient déjà — décennale, Kbis, RGE — mais la soumission n'est pas pilotable par API.
3. **Le moyen de paiement** : le client saisit sa propre carte sur son compte. Une fois.

Soit environ **20 minutes par client, une seule fois**, puis plus rien.

---

### La génération vidéo

Les chantiers publiés produisent la matière publicitaire. Rien à filmer, rien à monter.

**Production automatique à chaque chantier publié :**

- transition avant/après en balayage, sur la paire déjà alignée ;
- travelling lent sur les photos de détail ;
- incrustation texte : prestation, commune, surface, durée ;
- voix off construite à partir de sa dictée — **ses mots à lui** ;
- fond musical sous licence, jamais une piste récupérée ailleurs ;
- 15 à 20 secondes, formats 9:16, 1:1 et 16:9 générés d'un coup.

**Chaîne technique :** traitement d'images, assemblage ffmpeg, synthèse vocale. Rendu serveur, quelques minutes par vidéo, coût de calcul négligeable.

**Usages :** annonces Demand Gen et YouTube, publications sur la fiche Google, réseaux sociaux, et lecture sur la page du chantier elle-même.

**Validation :** même mécanique que les pages. Il regarde, il valide d'un tap. Jamais de diffusion sans son accord.

**Point juridique :** la clause de devis fournie par l'app (section 5.7) couvre explicitement **l'usage vidéo et publicitaire**, pas seulement la publication sur le site. Une photo d'intérieur diffusée dans une publicité payante sans autorisation, c'est un vrai risque. Les chantiers en extérieur ne sont pas concernés.

---

### Ce que l'automatisation change dans les chiffres

Avec un pilotage automatisé, le palier Croissance ne coûte plus 1,5 h par client et par mois, mais **environ 15 minutes** — lecture des alertes et cas particuliers.

| Palier Croissance | |
|---|---|
| Prix | 249 € HT/mois |
| Coût technique (dont vidéo et appels API) | −6,50 € |
| Coût humain (15 min à 30 €/h) | −7,50 € |
| Mise en place, une fois | −10 € (20 min amortis) |
| **Marge contributive** | **≈ 225 € (90 %)** |

**L'automatisation fait passer ce palier de 125 € à 225 € de marge.** Il devient aussi rentable que le produit pur, et c'est ce qui justifie l'investissement de développement.

Le plafonnement à une trentaine de comptes n'a plus lieu d'être. La seule limite qui subsiste : ne pas ouvrir l'option avant que le site convertisse — au moins 10 chantiers publiés et un taux de contact mesuré. Envoyer du trafic payant sur un site qui ne transforme pas brûle l'argent du client, automatiquement ou non.

### Le levier de marge

Chaque minute de relecture humaine supprimée vaut 2,50 € par client et par mois. Passer de 2 minutes à 30 secondes par page, c'est +3,75 € de marge mensuelle par client — plus que tout le coût technique réuni.

---

## 19. Acquisition — budget quasi nul

Pas de publicité payante. Tout ce qui suit est gratuit ou marginal, classé par coût réel et par délai.

### 19.1 Le cadre légal, d'abord

Ça conditionne tout le reste.

- **E-mail B2B : régime d'opposition.** Pas de consentement préalable requis si le message porte sur l'activité professionnelle du destinataire, si l'expéditeur est identifié, et si un lien de désinscription en un clic figure dans chaque envoi. Base légale : intérêt légitime, article 6.1.f du RGPD, et article L34-5 du CPCE.
- **Piège majeur :** cette tolérance ne vaut que pour les **adresses professionnelles**. Une adresse en gmail, orange.fr ou hotmail exige un consentement explicite même en B2B. Or beaucoup d'artisans n'utilisent que ça. **L'e-mail à froid ne couvrira donc qu'une fraction de la cible.**
- **Information dès le premier contact** (article 14 RGPD, données issues de sources publiques) : qui écrit, pourquoi, d'où vient la donnée, quels sont ses droits.
- **Désinscription honorée sous 7 jours**, liste de blocage permanente conservée.
- **Téléphone B2B : toujours autorisé** en régime d'opposition. L'interdiction du démarchage sans consentement entrée en vigueur le 11 août 2026 ne vise que les particuliers.

### 19.2 Le site pré-généré — l'arme propre au produit

On crée le site d'un artisan **avant de le contacter**, et on lui envoie le lien. Il voit son propre site avant d'avoir parlé à qui que ce soit. Aucun concurrent ne peut le faire : aucun ne génère en quelques minutes.

**Comment le faire proprement :**

- Construit uniquement à partir de la **donnée publique Sirene** : raison sociale, adresse, code APE, ancienneté, plus le statut RGE issu de la base publique.
- **Aucune photo récupérée ailleurs.** Ni Google — les conditions de l'API l'interdisent — ni son site actuel, dont les photos lui appartiennent. Les emplacements photo restent en attente, ce qui devient l'argument : « ce site attend vos chantiers ».
- **Lien privé, non indexé**, valable 30 jours, jamais publié publiquement sous son nom.
- Envoi par e-mail professionnel quand il en a un, sinon appel téléphonique avec le lien envoyé après.

**Coût : le temps de génération, quasi nul. C'est le canal au meilleur rendement.**

### 19.3 Activateur France Num — gratuit et officiel

France Num est le programme de la Direction générale des entreprises. Son réseau compte environ 5 000 Activateurs référencés, listés publiquement sur francenum.gouv.fr.

Le référencement est gratuit : il faut justifier d'une activité réelle et adhérer à une charte d'engagement.

**Ce que ça rapporte :**
- une fiche dans un annuaire public officiel que les artisans consultent ;
- une légitimité institutionnelle qui vaut mieux que n'importe quel argumentaire ;
- l'accès aux dispositifs régionaux qui exigent un prestataire référencé, ce qui **réduit le coût pour le client** — argument de vente direct ;
- le diagnostic numérique gratuit pour l'artisan, qui sert d'entrée en relation sans rien vendre.

**À savoir pour ne pas raconter n'importe quoi :** le chèque France Num national de 500 € est fermé depuis le 31 juillet 2021. Ce qui existe encore, ce sont des dispositifs régionaux qui ouvrent et ferment — Grand Est Transformation Digitale, aides AD Normandie, Pass Commerce et Artisanat selon les régions. Il faut vérifier ce qui est actif dans la région ciblée au moment de la vente, jamais citer un montant entendu ailleurs.

### 19.4 Le référencement de la plateforme

L'annuaire des chantiers réels (section 9) et une page par métier et par ville. C'est le seul canal dont le coût baisse avec le temps, mais il ne produit rien avant 6 à 12 mois.

À lancer immédiatement pour cette raison précise : il ne rapportera qu'après, donc plus on attend, plus on décale.

### 19.5 Le parrainage

Un artisan dont le site ramène des appels le dit à ses collègues. Dans un métier donné et un département donné, ça circule vite — c'est un milieu où les gens se connaissent.

Un mois offert de chaque côté. Coût réel : 79 € pour un client acquis, contre 300 à 500 € en acquisition classique. **C'est le canal le moins cher qui existe, et il ne démarre qu'avec les premiers clients satisfaits.**

D'où l'importance de l'accompagnement au premier chantier (section 13) : c'est ce qui fabrique les clients qui parlent.

### 19.6 Le terrain, ciblé

Un métier, un département. Pas « les artisans de France ».

- **Les dépôts de matériaux.** Un façadier passe chez son fournisseur toutes les semaines. Point P, Gedimat, Rexel, négoces indépendants. Présence physique, affichette, ou accord avec le responsable de dépôt. C'est là qu'ils sont, physiquement, toutes les semaines.
- **La Chambre de métiers départementale.** Bien plus accessible que la CAPEB nationale, et elle cherche des solutions à recommander à ses ressortissants.
- **Les groupes professionnels en ligne**, par métier. On y apporte de la valeur — un audit gratuit de fiche Google, par exemple — avant de vendre quoi que ce soit.

### 19.7 Ce qu'il ne faut pas faire

**Le démarchage téléphonique à froid en masse.** C'est exactement la méthode de Solocal et Local.fr, c'est ce que les artisans détestent, et se positionner contre eux tout en employant leur méthode annule l'argument.

L'appel reste légal et utile, mais **après** l'envoi du site pré-généré, jamais à froid dans le vide.

### 19.8 Coût d'acquisition visé par canal

| Canal | Coût par client signé | Délai |
|---|---|---|
| Parrainage | ~79 € (mois offert) | dès les premiers clients |
| Site pré-généré | temps de génération + relance | immédiat |
| Activateur France Num | 0 € (temps de référencement) | 1 à 3 mois |
| Référencement plateforme | 0 € variable | 6 à 12 mois |
| Terrain et dépôts | déplacement | immédiat |

**Objectif réel : coût d'acquisition moyen sous 150 €, très en dessous des 300 à 500 € que le modèle pourrait supporter.** La marge dégagée sert alors à recruter plus tôt, ou à baisser le prix face à la concurrence.

---

## 20. Périmètre — version unique

Tout ce qui suit fait partie de la livraison. Rien n'est reporté.

- Création complète : SIRET, prestations, zone, preuves, saisie guidée des chantiers passés, ton, génération, choix visuel, domaine, publication
- Enrichissement complet : notification quotidienne, envoi, tri automatique, analyse par modèle de vision, questions générées à la volée, champ libre et dictée, publication automatique
- Mode caméra à calque fantôme
- Alignement avant/après avec repli côte à côte
- Clause d'autorisation fournie à l'inscription
- Site statique complet, régénération incrémentale
- Système de design : 20 templates, 20 palettes, 10 couples typographiques, couleurs libres, interdictions anti-vibecoding
- Unicité garantie : aucune combinaison répétée, contrôle par métier et département
- Générateur de logo SVG, avec import et vectorisation d'un logo existant
- Tous les corps de métier listés en section 3
- Annuaire public
- Diffusion automatique sur la fiche Google, la Page Facebook et Instagram
- Rappel automatique par SMS sur appel manqué
- Accusé de réception, réponse pré-rédigée et relance du prospect
- Qualification de la demande : budget, délai, statut
- Simulateur d'aides à la rénovation, barèmes centralisés
- Simulateur de tarifs optionnel, en fourchette, relié au formulaire
- Prise de rendez-vous par demi-journée, confirmée par l'artisan
- Palier gratuit à vie sur sous-domaine
- Mode présentation plein écran pour les rendez-vous de devis
- Panneau de chantier avec QR code, généré prêt à imprimer
- Carte des chantiers et suivi client automatique
- Avis rattachés aux pages de chantier
- Multi-utilisateur : plusieurs membres, trois rôles, facturation par entreprise
- Photo horodatée et géolocalisée opposable, partage client par lien
- Suivi d'appels, tableau de bord temps réel et rapport mensuel
- Génération vidéo automatique à chaque chantier publié
- Chaîne publicitaire automatisée : création de campagnes, règles d'arbitrage, contestation des contacts
- Tableau de bord de modification

**Hors périmètre, pour raison technique et non par arbitrage :** la publication automatique sur la fiche Google dépend d'une autorisation accordée par Google, pas de nous (voir section 11). Elle est branchée le jour où l'accès est obtenu, sans que le reste en dépende.

**Ce que ce choix coûte :** une version complète sur 18 métiers avec un vrai système de design, c'est un chantier de développement long. À prendre en compte dans le calendrier, pas dans le périmètre.

**Ne jamais faire :** pages communes sans contenu réel, affirmation non constatée sur les photos, photos de banque d'images, texte sans fait dedans.

## 21. Instrumentation — dès le premier client

Chaque page publiée trace, dès le jour 1 : positions, impressions, clics, appels générés, demandes de devis.

Au bout de plusieurs milliers de chantiers, ces données disent quelle structure de page performe pour quel ouvrage dans quelle zone. Ça ne s'achète pas, ça s'accumule. Si le suivi est ajouté un an après le lancement, une année de données est perdue définitivement.

---

## 22. Validation terrain — avant de développer, pas une version du produit

Ce n'est pas une version dégradée du produit : c'est un test de marché fait à la main, sans code, pour vérifier une seule chose avant d'engager le développement.

**Deux hypothèses, deux niveaux de risque.**

*Phase 1 — risque faible.* Créer un site à partir d'un SIRET et de quelques réponses, c'est prouvé : Quickio le fait déjà à 14,90 €/mois. La saisie guidée des chantiers passés est le même mécanisme que la phase 2, répété. Rien à tester séparément.

*Phase 2 — la seule inconnue.* Est-ce que l'artisan envoie ses photos, semaine après semaine ? Personne ne peut le dire depuis un bureau.

**Protocole**

1. 5 artisans du métier choisi, dans la même zone.
2. Un numéro WhatsApp. Un message par jour : « pense à photographier ton chantier ».
3. Ils envoient. Les pages sont montées à la main.
4. La page leur est renvoyée avec le lien.

**Critère de décision**

- 5 artisans qui envoient 3 fois sur 3 semaines → on construit.
- 2 qui décrochent dès la deuxième semaine → on sait quoi corriger avant d'écrire une ligne.

---

## 23. Stack

- Front : Astro (génération statique) ou Next SSG
- App : React Native ou PWA
- Base et auth : Supabase, multi-tenant avec RLS par `site_id`
- Hébergement et domaines : Vercel, ajout programmatique des domaines clients
- Images : traitement serveur, stockage objet, sortie AVIF/WebP
- Vision et texte : API modèle pour le classement des photos et la rédaction
- Vidéo : ffmpeg, synthèse vocale, rendu serveur
- Publicité : API Google Ads en accès Basic, compte administrateur, LSA
- Réseaux sociaux : API unifiée au lancement (approbations Meta déjà détenues), internalisation possible ensuite
- Données publiques : API entreprises (Sirene), base RGE
- Paiement : Stripe (carte + SEPA), facturation Factur-X
- SMS et téléphonie : opérateur français ou européen
- Stockage objet sans frais de sortie, hébergement UE

### Chaîne de développement

- **Claude Code** écrit l'intégralité du code, en local et sur GitHub.
- **Claude Cowork** pour les documents, spécifications et supports.
- **Claude in Chrome** pour les tests d'interface de bout en bout.
- **Fabrice** : conception produit, intégrations d'API, arbitrages, validation.

Conséquences à intégrer dès le départ : dépôts séparés par domaine fonctionnel pour garder des contextes exploitables, tests automatisés écrits en même temps que le code, et documentation d'architecture tenue à jour dans le dépôt — c'est elle qui sert de mémoire entre les sessions.

---

## 24. Concurrence — marché français, état au 6 septembre 2026

### 24.1 La carte

| | App terrain | Site domaine propre | Page par chantier rédigée | SEO structuré | IA | Publicité | Prix |
|---|---|---|---|---|---|---|---|
| **Ce produit** | oui | oui | oui | complet | analyse et rédaction | automatisée | 79 € |
| **TrustUp Pro** | oui | oui, fait par eux | non | partiel | non | non | Starter gratuit, paliers payants |
| **Letmo** | oui | non, sous-domaine | non, galeries | non | non | non | 15,99 € / 2 membres |
| **Quickio** | non | oui | non | à la création | génération initiale | non | 14,90 € |
| **Obat Studio** | non | oui, une page | non | partiel | non | non | prestation |
| **Simplébo** | non | oui | non | oui | non | non | dès ~25 € + frais |
| **MeilleurArtisan** | non | oui | non | oui | non | non | prestation |
| **Solocal / Local.fr** | non | oui | non | oui | non | oui, humaine | 100 à 250 €, engagement long |
| **Digitori** et agences SEO | non | oui | non | oui | partiel | selon offre | 500 € et plus |

### 24.2 TrustUp Pro — le plus dangereux

Entité belge avec une structure française. 4 500 entreprises clientes en Belgique et en France, 97,6 % de clients satisfaits, applications iOS et Android.

**Ce qu'ils font :** devis et factures, suivi de chantier, planning, pointage géolocalisé, rentabilité par chantier, facturation électronique PEPPOL, marketplace de chantiers qualifiés, et création de site web. Plus de 1 500 sites réalisés par leurs équipes, optimisés pour le référencement local, avec les avis collectés sur leur plateforme mis en avant.

**Leur meilleur coup, et c'est le meilleur du marché :** le plan **Starter gratuit à vie**, créé expressément pour répondre à l'obligation française de facturation électronique. Une contrainte légale datée devient une porte d'entrée gratuite, puis la montée en gamme se fait à l'intérieur.

**Leurs faiblesses :**
- le site est une prestation figée, pas un moteur — les avis l'alimentent, pas les chantiers ;
- leur promesse d'acquisition repose sur **leur** marketplace, donc l'artisan reste dépendant d'eux ;
- pas de page de chantier rédigée, pas de page commune adossée à un ouvrage réel.

### 24.3 Letmo — la meilleure application terrain

Photos horodatées, géolocalisées, avec auteur et tampon date-lieu opposable. Carte de tous les chantiers. Cinq rôles avec cloisonnement des sous-traitants. Partage de galerie au client par lien, sans création de compte. Suivi client automatique : notification le soir, uniquement les jours où des photos ont été ajoutées. **Mode Présentation** affichant les réalisations en plein écran en rendez-vous client.

**Leur limite :** l'adresse est un sous-domaine, c'est une page à rubriques et non un site, aucun texte généré, les photos restent en galerie. Leur positionnement — couche terrain à côté de Batigest ou EBP, avec les collectivités et les clubs sportifs dans la cible — rend improbable un virage vers le référencement.

### 24.4 Quickio — le meilleur parcours d'entrée

Site généré en 2 minutes, 14,90 € HT, essai 30 jours sans carte bancaire, domaine .fr inclus pendant toute la durée de l'abonnement. Annuaire de 2 millions d'entreprises, observatoire des métiers, calculateurs gratuits, blog quotidien.

**Leur limite :** le site est figé après la génération, il ne se nourrit de rien.

### 24.5 Les autres

- **Obat Studio** — logo, site une page, cartes de visite, panneaux de chantier, domaine, maintenance, plus l'annuaire Travaux et l'aide à la fiche Google. Prestation humaine facturée.
- **MeilleurArtisan** — plus de 3 000 sites depuis 2007. Une fonction notable : la remontée automatique des avis Google sur le site du client.
- **Simplébo** — agence par abonnement, partenaire CAPEB. Le contenu reste à la charge du client.
- **Solocal et Local.fr** — 100 à 250 €/mois sur 4 ou 5 ans, soit 4 800 à 15 000 € au total. Site figé, aucune preuve de résultat.
- **Digitori et la couche d'agences SEO** (Sparkana, WeComm, MKZ, AxioneWeb, Avantage Digital, Mareferencyelle, Digibat, NZDigital) — le marché du service est saturé, celui du produit est vide. Une prestation SEO coûte 500 à 2 500 €/mois en France, les offres sérieuses pour artisan démarrant vers 500 € HT.

### 24.6 Ce que personne ne fait

**La chaîne complète : photo de chantier → analyse → page publiée → référencement.**

Letmo a les photos sans le référencement. Quickio a le site sans les chantiers. TrustUp a la base sans le moteur. Les agences ont le savoir-faire sans le produit.

### 24.7 Le risque réel

**Obat, Vertuoza et TrustUp** ont déjà la base d'artisans et la donnée chantier. Ce qui les ralentit : chez Obat et TrustUp, le site est une prestation humaine facturée ; la transformer en moteur self-service revient à tuer une ligne de revenu.

**Fenêtre estimée : 12 à 18 mois.**

---

## 24bis. Ce qu'on prend à la concurrence

Cinq mécaniques éprouvées, reprises et améliorées. Par ordre d'impact.

### 1. Le palier gratuit à vie adossé à une obligation légale

*Source : TrustUp Pro.*

Un palier **gratuit à vie** qui répond à une contrainte réglementaire datée que l'artisan ne peut pas éviter. C'est la meilleure porte d'entrée du marché : il s'inscrit parce qu'il y est obligé, pas parce qu'on l'a convaincu.

**Notre version :** le site généré depuis le SIRET, publié sur un sous-domaine, gratuit à vie. Il l'a, il le voit, il le montre. Le passage payant se déclenche quand il veut son propre domaine, ses pages de chantier et le référencement.

Ça transforme aussi le pipeline de prospection (annexe A) : au lieu d'envoyer un lien qui expire en 30 jours, on envoie un site qui reste.

### 2. Le mode présentation en rendez-vous client

*Source : Letmo.*

En rendez-vous de devis, l'artisan ouvre un chantier similaire déjà réalisé et l'affiche en plein écran : avant/après, matériaux, durée, commune. Ça transforme un devis, et c'est ce qui répond au vrai problème du secteur — le devis qui n'aboutit pas.

**Notre version :** gratuite à construire, puisque les pages existent déjà. Recherche par prestation et par commune, affichage plein écran, fonctionne hors ligne.

### 3. Le panneau de chantier avec QR code

*Source : Obat Studio, amélioré.*

Obat vend des panneaux de chantier. Personne ne les relie au site.

**Notre version :** le panneau porte un **QR code qui mène à la page du chantier en cours ou à ses réalisations**. Un panneau devant une maison en travaux pendant trois semaines dans une rue passante, c'est de l'acquisition physique gratuite. Le fichier est généré automatiquement, prêt à imprimer, avec son logo et ses couleurs.

### 4. Les études de marché locales automatisées

*Source : Digitori, industrialisé.*

Ils publient des études locales ville par ville — demande réelle et état de la concurrence. Excellent pour le référencement, et ça attire exactement les artisans qu'on veut démarcher.

**Notre version :** automatisée à grande échelle depuis les données publiques — nombre d'entreprises par métier et par commune via Sirene, densité concurrentielle, taux de certification RGE, part d'entreprises sans site. Une page par commune sur le domaine de la plateforme, sans intervention humaine.

Double emploi : contenu qui se classe, et argumentaire chiffré pour la prospection.

### 5. L'avis rattaché à sa page de chantier

*Source : MeilleurArtisan, amélioré.*

Ils remontent automatiquement les avis Google sur le site du client.

**Notre version :** l'avis est **rattaché à la page du chantier correspondant**. Un avis qui parle d'un ravalement s'affiche sous les photos de ce ravalement. C'est la preuve la plus forte possible, et ça enrichit la page pour le référencement.

### Aussi repris de Letmo

- Le **suivi client automatique** : notification au client le soir, uniquement les jours où des photos ont été ajoutées. Informatif, jamais du spam.
- La **carte des chantiers**, qui sert aussi à visualiser la couverture territoriale réelle.

---

## 25. Stratégie concurrentielle

### 25.1 Ne jamais laisser la comparaison se faire sur le site

Un artisan qui connaît Letmo à 16 € ou Quickio à 15 € comparera. La réponse doit être immédiate et tenir en une phrase :

> **Eux affichent vos photos. Ici, vos chantiers vous ramènent des appels.**

La démonstration se fait sur le tableau de bord — appels reçus, demandes de devis — jamais sur une maquette de site. Le produit vendu n'est pas un site, c'est un flux de demandes. Un concurrent à 16 € ne peut pas tenir cette promesse, donc la comparaison de prix ne se pose plus.

### 25.2 Absorber ce qu'ils ont et que nous n'avions pas

Deux fonctions reprises, décrites en 5.12 et 5.14 :

- **La photo qui fait preuve** — horodatée, géolocalisée, opposable. Elle donne une raison d'ouvrir l'app tous les jours, indépendamment du marketing, et le stock de photos se constitue tout seul.
- **Le multi-utilisateur** — plusieurs membres, trois rôles, cloisonnement des sous-traitants. Sans ça, toute entreprise de plus de deux personnes préfère Letmo.

Avec ces deux ajouts, il n'existe plus une seule raison de prendre Letmo plutôt que ce produit, sauf le prix — et le prix ne se compare pas puisque la promesse est différente.

### 25.3 Pourquoi chacun aurait du mal à suivre

- **Letmo** devrait construire les domaines propres, la génération de texte, l'architecture SEO et le balisage. C'est un autre métier, et leur tarif ne le finance pas.
- **Quickio** devrait construire une application mobile et une chaîne photo. Ils sont web, partis d'une description.
- **Obat** devrait supprimer la prestation facturée de son studio.
- **Solocal et Local.fr** devraient renoncer aux contrats longs et à la commission commerciale qui font tout leur modèle.

Chacun aurait à renier ce qui le fait vivre aujourd'hui. C'est la meilleure protection possible — meilleure qu'un brevet.

### 25.4 Les trois fossés, par solidité

1. **L'annuaire de chantiers réels** (section 9) — ne se scrape pas, ne s'achète pas, s'accumule chantier par chantier. Effet de réseau : chaque inscrit le rend plus attirant pour le suivant.
2. **Le corpus annoté** (section 21) — quelle structure de page performe pour quel ouvrage dans quelle zone. Ne marche que si l'instrumentation est posée dès le premier client.
3. **Le référencement acquis du client** — au bout de 24 mois il a 50 pages classées. Partir, c'est les perdre. Ça retient, ça ne conquiert pas.

Et **le domaine reste à son nom**, ce qui désamorce l'accusation d'enfermement que subissent tous les concurrents.

### 25.5 Ce qui n'est pas un fossé

Le design, les templates, la génération de texte, la vidéo, le calque caméra, les données publiques RGE et Sirene. Tout ça se rattrape en six mois par une équipe financée. Ne jamais bâtir la défense dessus.

### 25.6 La seule chose qui décide vraiment

Les trois fossés sont des **fossés de temps**. Ils demandent 18 à 24 mois d'exploitation continue : vendre, relancer, accumuler des chantiers publiés.

La stratégie ne consiste donc pas à ajouter des fonctions, mais à **commencer à accumuler le plus tôt possible**. Chaque mois de retard est un mois d'avance offert au premier français qui s'y mettra.

---

## Annexe A — Pipeline de prospection (outil interne)

Outil à usage interne, pas un module du produit. Objectif : trouver les entreprises actives, générer leur site, puis les contacter à la chaîne.

### A.1 Extraire

API entreprises publique (`recherche-entreprises.api.gouv.fr`), sans authentification.

- Filtrage par **code APE** du métier visé et par **département**.
- **`etat_administratif=A` obligatoire.** Sans ce paramètre, une majorité d'entreprises cessées remonte dans les résultats.
- Attention : l'API ignore silencieusement les paramètres inconnus, et `total_results` plafonne à 10 000 — c'est un plancher, pas un décompte.

**Filtres de sélection :**

| Critère | Valeur |
|---|---|
| Ancienneté | plus de 2 ans |
| Effectif | 0 à 10 |
| Certification RGE | croisée avec la base publique, priorité aux certifiés |

Les RGE sont prioritaires : ce sont ceux qui investissent, et le badge est déjà exploitable sur leur futur site.

### A.2 Qualifier

Pour chaque entreprise : existence d'un site, existence et état de la fiche Google.

| Cas | Valeur | Action |
|---|---|---|
| Pas de site, fiche Google active | **la meilleure** | prioritaire — visible, perd des demandes, rien à résilier |
| Site ancien ou cassé | bonne | vérifier chez quel prestataire |
| Site récent chez Simplébo, Solocal, Local.fr | faible | écarter — sous contrat long |

### A.3 Générer en masse

Génération par lots, **à partir de la seule donnée publique** : Sirene et base RGE. Aucune photo — ni Google, dont les conditions l'interdisent, ni son site actuel, dont les images lui appartiennent.

Les emplacements photo restent vides et deviennent l'argument : *ce site attend vos chantiers.*

Un **lien privé non indexé** par entreprise, valable 30 jours.

### A.4 Contacter

**Par lots de 50, jamais 400 d'un coup.** On ne peut pas absorber 400 réponses, et il faut ajuster le message sur les premiers retours.

- **E-mail professionnel** quand il existe : régime d'opposition, désinscription en un clic, information article 14 RGPD dès le premier message.
- **Téléphone** pour toutes les adresses personnelles (gmail, orange.fr, hotmail), qui exigent un consentement même en B2B. Le démarchage téléphonique B2B reste autorisé.
- Jamais d'appel à froid sans avoir envoyé le site d'abord.

### A.5 Mesurer l'ouverture — le point décisif

**Il faut savoir qui a ouvert son site et combien de temps il y est resté.**

Celui qui l'a regardé trois minutes est rappelé le lendemain. C'est là que se font les signatures, pas dans le volume d'envois.

Signaux à tracer : ouverture du lien, durée, pages vues, retour une seconde fois, clic sur le bouton de contact.

### A.6 Suivre

Table simple : entreprise, SIREN, métier, commune, qualification, date d'envoi, ouverture, date de contact, réponse, relance prévue, statut.

Sans ça, on rappelle les mêmes et on en oublie la moitié.

### A.7 Ordre d'exécution

1. Un métier, un département.
2. Extraction et qualification.
3. Génération du lot complet.
4. Envoi par vagues de 50.
5. Relance à 48 h sur les seuls ouvreurs.
6. Métier suivant, même département, avant de changer de département.
