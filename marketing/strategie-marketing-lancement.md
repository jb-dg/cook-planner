# Stratégie marketing — Lancement Weatly (App Store & Play Store)

*Préparé le 1er septembre 2026. Hypothèses de travail : budget marketing 0 € (croissance 100 % organique), marché cible France + francophonie élargie (Belgique, Suisse, Québec), modèle gratuit au lancement, liste d'attente/bêta-testeurs déjà existante.*

---

## 1. Où en est Weatly aujourd'hui

- Version 1.5.1, build Android en piste **alpha** sur Play Console : le produit est mature côté fonctionnalités (foyers partagés, planning hebdo temps réel, carnets de recettes, import de recettes, liste de courses fusionnée) mais pas encore soumis en production sur les deux stores.
- Une liste d'attente / bêta-testeurs existe déjà : c'est l'actif le plus précieux pour un lancement sans budget, et il n'est pas encore exploité pour la suite de ce plan.
- Pas de compte réseau social actif, pas de landing page publique confirmée : tout le pré-lancement est à construire.
- Aucune monétisation en place (pas de paywall détecté dans le code) : cohérent avec le choix "gratuit au lancement".

## 2. Paysage concurrentiel (marché francophone)

| App | Modèle | Ce qu'elle fait bien | Sa limite |
|---|---|---|---|
| **Jow** | Gratuit + in-app / Jow+ | Leader du marché (revendique plusieurs millions d'utilisateurs), commande drive intégrée (Carrefour, Leclerc, Auchan, Intermarché, Monoprix) | Catalogue de recettes imposé : impossible d'ajouter ses propres recettes familiales |
| **Marmiton** | Gratuit + pub / premium | Communauté immense, 90 000+ recettes, avis utilisateurs | Pensé "recherche de recette", pas "planning de foyer partagé" |
| **La Fabrique à Menus** (Santé publique France) | 100 % gratuit | Aucune monétisation cachée, nutrition validée | Aucune dimension multi-utilisateur / temps réel |
| **MesMenus** | Freemium ~5€/mois | Extraction IA de recettes par photo | SaaS payant tôt, jeune, moins pensé "foyer" |
| **WeChef** | Freemium ~5€/mois | Import Instagram/Pinterest | Pas de temps réel multi-utilisateur mis en avant |
| **Paprika / Mealime / AnyList / BigOven** | Payant ou freemium | Gestion de recettes mature, sync appareils | Anglophones ou US-centrés, pas pensés pour un foyer français, expérience individuelle plus que familiale |

**Ce que personne ne fait bien sur ce marché** : une expérience *vraiment* collaborative et temps réel — plusieurs personnes du même foyer qui voient et modifient le même planning, le même carnet de recettes personnel et la même liste de courses en direct, sans catalogue imposé et sans dépendre d'un drive en particulier. Jow gagne sur la commodité (commande directe), mais perd sur la personnalisation ; les apps de gestion de recettes (Paprika, AnyList) gagnent sur la personnalisation mais restent mono-utilisateur ou peu françaises. Weatly se positionne exactement dans cet angle mort.

## 3. Positionnement

**Une phrase** : *Weatly, le planning de repas qu'on organise à plusieurs — colocs ou famille — avec ses propres recettes, partagées et synchronisées en temps réel.*

**Ce qu'on met en avant** :
1. Le foyer, pas l'individu — c'est *le* différenciateur face à Jow, Marmiton, Paprika.
2. Les recettes des gens, pas un catalogue imposé — import depuis URL ou texte collé, photos, recettes de famille.
3. Le temps réel — un membre du foyer coche un ingrédient sur la liste de courses, tout le monde le voit instantanément.
4. Gratuit, sans friction — pas de paywall à l'installation, argument fort tant qu'il est vrai.

**Cibles prioritaires** (dans cet ordre pour le lancement) :
- **Familles avec enfants** qui galèrent chaque dimanche soir à savoir "on mange quoi cette semaine" — persona historique du produit, le plus proche du besoin d'origine.
- **Colocations** (étudiants, jeunes actifs) qui veulent répartir équitablement courses et popote — segment quasi absent du positionnement des concurrents actuels, à occuper en premier pendant que personne ne le revendique.
- **Couples** qui viennent d'emménager ensemble et cherchent une routine.

## 4. Store listing (ASO) — France & francophonie

Sans budget publicitaire, le classement organique dans les résultats de recherche des deux stores est le canal d'acquisition n°1 sur la durée. Quelques principes 2026 à respecter dès la première soumission :

- **Nom / titre** : inclure le mot-clé principal à côté de la marque, ex. `Weatly – Menu de la semaine & courses` (App Store : 30 caractères pour le titre, encore 30 pour le sous-titre — ne pas les gaspiller sur du descriptif générique).
- **Champ mots-clés (iOS, 100 caractères)** : cibler les requêtes réelles plutôt que des synonymes de la marque — ex. `planning repas,menu semaine,liste courses,recette famille,foyer,coloc,batch cooking`. Ne jamais répéter un mot déjà dans le titre/sous-titre (gaspillage de caractères).
- **Description longue (Play Store, indexée intégralement)** : premières lignes = proposition de valeur + mots-clés naturels, car Google indexe tout le texte, contrairement à Apple.
- **Screenshots** : depuis l'évolution récente de l'algorithme Apple, le texte visible sur les captures est lu par OCR et compte pour le classement — pas seulement pour la conversion. Éviter les légendes génériques ("Facile à utiliser") et préférer des formulations concrètes et cherchées : "Planning de la semaine partagé à plusieurs", "Vos recettes, votre foyer, une seule liste de courses". Première capture = message clé visible en 7 secondes, jamais un écran de connexion.
- **Icône** : le lettermark "W" actuel sur fond `#BB6C26` est cohérent (formes arrondies = perçu comme chaleureux/accessible) ; s'assurer qu'il reste lisible en petite taille sur fond de home screen clair et sombre.
- **Localisation** : prévoir a minima FR (France) et, si le temps le permet, une variante Belgique/Suisse (vocabulaire quasi identique, mais Apple/Google permettent un ciblage par pays — utile pour suivre les téléchargements par marché francophone séparément).
- **Avis** : demander une note *après* un moment de succès dans le parcours (ex. après la génération réussie d'une liste de courses), jamais à froid à l'ouverture. Les bêta-testeurs existants sont la meilleure source des 10-20 premiers avis — sans premiers avis, la fiche stagne quel que soit le trafic généré ailleurs.

## 5. Pré-lancement (2 à 3 semaines avant la mise en ligne stores)

Objectif : arriver à la publication avec une liste d'attente chaude, des assets prêts, et les 10-20 premiers avis déjà en réserve.

1. **Réactiver la liste d'attente existante.** Un email/message court : date de sortie estimée, accès prioritaire, invitation explicite à devenir un des tout premiers utilisateurs. C'est l'audience la plus susceptible de mettre 5 étoiles et de partager le lien à leur propre foyer.
2. **Landing page simple** sur `weatly.fr` (déjà en place techniquement) : proposition de valeur en une ligne, 3 captures d'écran, formulaire d'inscription, lien "Rejoindre la liste d'attente" si pas encore en ligne sur les stores.
3. **Comptes Instagram et TikTok** créés et le pseudo réservé partout (même stratégie de nommage que le domaine) avant le lancement, même si la publication de contenu commence plus tard.
4. **Recruter 5 à 10 foyers tests réels** (au-delà des bêta-testeurs déjà inscrits) pour valider que l'expérience à plusieurs (invitation, temps réel, liste de courses partagée) fonctionne sans accroc — ce sont ces foyers qui laisseront les premiers avis vécus.
5. **Préparer les assets stores** : captures d'écran optimisées (voir section 4), description FR finalisée, éventuellement une courte vidéo preview (10-15 s, montre le flux : ajouter un repas → générer la liste de courses → un autre membre du foyer coche un article en direct).

## 6. Lancement (semaine 0)

- **Publier d'abord sur les deux stores simultanément si possible** (éviter un grand écart temporel iOS/Android, qui fragmente la communication).
- **Product Hunt** : lancement un mardi, mercredi ou jeudi, tôt le matin (heure UTC/US) pour maximiser la fenêtre de visibilité. Répondre à *chaque* commentaire dans les deux premières heures. Cadre le produit sur l'angle "planning de repas collaboratif pour foyers", pas "encore une app de recettes" — c'est ce qui le distinguera dans les commentaires.
- **Communautés françaises pertinentes** : sous-forums Reddit francophones sur la vie étudiante/coloc et la parentalité, groupes Facebook locaux de quartier ou de parents d'élèves, forums colocation (ex. threads "organisation coloc"). Toujours se présenter comme le créateur et contextualiser plutôt que poster un lien brut.
- **Message adapté à chaque canal** (pas de copier-coller identique) : angle "gain de temps" pour les familles, angle "fin des embrouilles sur qui a acheté quoi" pour les colocs.
- **Mobiliser la liste d'attente et les foyers tests** pour les tout premiers téléchargements et avis dès le jour J — un score et un volume d'avis décents dès la première semaine aident au classement organique.

## 7. Croissance post-lancement (100 % organique)

### Le levier structurel : la boucle virale intégrée au produit
Weatly a un mécanisme de croissance déjà construit dans le produit : **inviter son foyer**. Chaque utilisateur qui crée un foyer doit, par nature du produit, inviter au moins une autre personne pour que la valeur soit complète (planning + courses partagées n'ont de sens qu'à plusieurs). C'est un facteur K natif qu'il faut rendre aussi visible et fluide que possible dans le parcours (rappel doux si un foyer reste à un seul membre après quelques jours, lien d'invitation facile à partager par SMS/WhatsApp). C'est le canal le moins cher et le plus durable : à traiter comme une priorité produit autant que marketing.

### Contenu TikTok / Instagram Reels
- Formats qui fonctionnent en ce moment pour des apps utilitaires : **carrousels/slides texte** ("5 signes que votre foyer a besoin d'un planning de repas partagé"), **face caméra + écran de l'app en arrière-plan** montrant un vrai foyer qui organise sa semaine, et le format **"aperçu furtif"** (montrer l'app 3 secondes dans une vidéo lifestyle plus large pour créer une envie qu'on assouvit en commentaire).
- Rythme réaliste sans budget : mieux vaut 3-4 publications par semaine tenues dans la durée qu'une rafale suivie d'un abandon — la régularité compte plus que le volume brut pour un compte qui démarre de zéro.
- Traiter la section commentaires comme une page de conversion : répondre vite, rediriger vers le lien en bio, utiliser la vidéo-réponse pour les questions récurrentes.
- Partenariats à coût nul avec des micro-créateurs cuisine/organisation familiale/vie étudiante (échange contre accès gratuit + mise en avant, pas de cachet) — cibler des comptes de quelques milliers d'abonnés plutôt que les gros comptes, taux d'engagement et pertinence de l'audience prioritaires sur la portée.

### SEO / contenu long
- Le créneau "colocation" est sous-exploité par les concurrents actuels : un ou deux articles de blog sur `weatly.fr` ("comment organiser les repas en colocation sans embrouilles") peuvent capter une recherche peu disputée et renvoyer vers le store.

### Cycle ASO continu
- Ne pas soumettre les assets une fois pour toutes : ajuster screenshots, titre, sous-titre toutes les 2 à 4 semaines selon les données de classement et de conversion des consoles stores, en ne changeant qu'une variable à la fois pour savoir ce qui a un effet.

## 8. Calendrier indicatif (8 semaines)

- **Semaines -3 à -1** : réactivation liste d'attente, landing page, comptes réseaux créés, recrutement foyers tests, assets stores finalisés.
- **Semaine 0** : soumission stores, lancement Product Hunt, premiers posts communautaires, mobilisation des premiers avis.
- **Semaines 1-2** : démarrage du rythme de contenu TikTok/Instagram, premiers contacts micro-créateurs, premier article de blog.
- **Semaines 3-4** : première itération ASO basée sur les données réelles (mots-clés qui convertissent, taux de clic screenshots), bilan de la boucle d'invitation foyer (combien de foyers restent à 1 seul membre ?).
- **Semaines 5-8** : deuxième vague de contenu, extension prudente au reste de la francophonie (Belgique/Suisse) si les métriques France sont saines, décision sur une éventuelle monétisation future à partir des retours d'usage.

## 9. KPIs à suivre

- Taux de conversion fiche store (vues → installations) — objectif indicatif à affiner après les premières semaines de données réelles.
- % de foyers qui passent de 1 à 2+ membres dans les 7 jours (le vrai indicateur que la proposition de valeur "partagée" fonctionne).
- Note moyenne et volume d'avis sur chaque store.
- Rétention à J7 / J30 (un foyer qui a généré au moins une liste de courses dans sa première semaine est le signal d'activation le plus pertinent pour ce produit).
- Répartition des installations par pays (France vs Belgique/Suisse/Québec) pour arbitrer l'effort de localisation.

## 10. Prochaines décisions à prendre

- Choisir la date cible de soumission stores pour caler tout le calendrier de la section 8 sur une date réelle.
- Décider qui anime les comptes réseaux sociaux (temps disponible réaliste vu qu'il n'y a pas de budget pour déléguer).
- Trancher si un article/une vidéo de lancement doit être écrit en plusieurs variantes (famille vs coloc) ou une seule communication généraliste pour commencer.
