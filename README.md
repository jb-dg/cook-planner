# Weatly

Weatly est une application de planification des repas pour organiser les recettes, préparer les menus de la semaine et générer une liste de courses partagée.

L'app fonctionne avec Expo et React Native pour iOS et Android. Les données sont synchronisées avec Supabase afin de conserver les recettes, les plannings, les listes de courses et les foyers utilisateurs.

## Fonctionnalités

- Authentification par email/mot de passe, Google et Apple via Supabase Auth.
- Création ou rattachement à un foyer pour partager recettes, menus et courses.
- Planning hebdomadaire avec navigation par semaine, vue focus, vue liste et sauvegarde automatique.
- Synchronisation en temps réel des menus et listes partagées entre membres du foyer.
- Carnets de recettes avec livre système "Recettes du foyer" et livres personnalisés.
- Création et édition de recettes avec titre, durée, portions, difficulté, ingrédients, étapes, source et photos.
- Import de recettes depuis une URL ou un texte collé quand les métadonnées de recette sont disponibles.
- Liste de courses avec ajout manuel, ajout depuis une recette et génération depuis le planning de la semaine.
- Fusion intelligente des ingrédients similaires pour éviter les doublons dans la liste de courses.
- Profil utilisateur avec pseudo, avatar, gestion du foyer et déconnexion.

## Stack technique

- Expo 54
- React 19
- React Native 0.81
- Expo Router
- Supabase Auth, Database, Realtime, Storage et Edge Functions
- TypeScript
- Vitest
- ESLint Expo

## Structure du projet

```text
app/                     Routes Expo Router
components/              Composants UI partagés
contexts/                Contextes globaux, dont AuthContext
features/auth/           Écrans et hooks d'authentification
features/planner/        Planning hebdomadaire et sauvegarde
features/profile/        Profil et gestion du foyer
features/recipes/        Carnets, recettes et flux d'ajout
features/shoppingList/   Liste de courses et fusion d'ingrédients
lib/                     Clients et helpers Supabase
supabase/                Migrations SQL et Edge Functions
tests/                   Tests unitaires Vitest
theme/                   Design tokens, couleurs et styles partagés
```

## Prérequis

- Node.js
- npm
- Expo CLI via `npx expo`
- Un projet Supabase configuré avec les migrations du dossier `supabase/migrations`

## Configuration

Créer un fichier `.env` à la racine avec les variables publiques utilisées par Expo :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

Les redirections d'authentification utilisent le schéma d'URL `cookplanner://auth/callback`.

Pour l'import depuis une URL, déployer aussi l'Edge Function Supabase `recipe-html` présente dans `supabase/functions/recipe-html`.

Pour la recherche de recettes RecipeAPI.io en français/anglais, ajouter le secret côté Supabase puis déployer la fonction :

```bash
supabase secrets set RECIPEAPI_API_KEY=votre-clé-recipeapi
supabase functions deploy recipe-search
```

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Commandes utiles :

```bash
npm run start:lan
npm run start:tunnel
npm run start:dev-client
npm run ios
npm run android
```

## Qualité

```bash
npm run lint
npm test
```

Les tests couvrent notamment la validation d'authentification et la fusion des ingrédients de la liste de courses.

## Supabase

Les tables principales utilisées par l'application sont :

- `profiles`
- `households`
- `household_members`
- `recipes`
- `weekly_menus`
- `shopping_list_items`

Le stockage média est utilisé pour les avatars et les photos de recettes. Les politiques RLS et buckets doivent être alignés avec les migrations Supabase du projet.

## Plateformes

Weatly cible :

- iOS avec le bundle `com.jbdg.weatly`
- Android avec le package `com.jbdg.weatly`
