# Planner Module - Architecture

Ce module a été refactorisé pour améliorer la maintenabilité, la réutilisabilité et les performances.

## 📁 Structure

```
features/planner/
├── utils/              # Utilitaires et types
│   ├── types.ts        # Définitions TypeScript
│   ├── constants.ts    # Constantes (DEFAULT_MENU, MEAL_SLOTS)
│   └── helpers.ts      # Fonctions utilitaires (normalizeDays)
│
├── hooks/              # Hooks personnalisés
│   ├── usePlannerData.ts      # Chargement/sync des menus hebdo
│   ├── useRecipes.ts          # Chargement des recettes
│   ├── useWeekNavigation.ts   # Navigation entre semaines
│   └── useToast.ts            # Gestion des notifications
│
├── components/         # Composants UI
│   ├── PlannerHeader.tsx      # Header avec titre et actions
│   ├── WeekProgressCard.tsx   # Carte de progression
│   ├── DayGridSelector.tsx    # Grille de sélection des jours
│   ├── DayMealCard.tsx        # Carte repas (réutilisable)
│   ├── FocusView.tsx          # Vue focus (un jour)
│   ├── ListView.tsx           # Vue liste (semaine complète)
│   ├── WeekPickerModal.tsx    # Modal de sélection de semaine
│   ├── RecipePickerModal.tsx  # Modal de sélection de recette
│   └── Toast.tsx              # Notification toast
│
└── styles.ts           # Styles partagés
```

## 🎯 Composant Principal

`app/(tabs)/planner.tsx` (268 lignes) - Orchestrateur principal qui :
- Gère l'état global (session, viewMode, modals)
- Coordonne les hooks
- Compose les composants UI
- Gère la sauvegarde

## 🔧 Hooks Personnalisés

### `usePlannerData(session, referenceDate)`
Charge et synchronise les menus hebdomadaires depuis Supabase.

**Retourne :**
- `days` : Données des 7 jours
- `setDays` : Modifier les données
- `syncing` : État de chargement
- `weekNumber`, `month`, `year` : Méta-données

### `useRecipes(session)`
Charge les recettes de l'utilisateur/foyer.

**Retourne :**
- `recipes` : Liste des recettes
- `recipesLoading` : État de chargement
- `recipesError` : Erreur éventuelle

### `useWeekNavigation()`
Gère la navigation entre semaines et le calendrier.

**Retourne :**
- `selectedDate`, `setSelectedDate`
- `referenceDate` : Début de semaine (lundi)
- `weekRangeLabel` : "1 Jan → 7 Jan"
- `handleNavigate(direction)` : Prev/Next
- `handleGoToToday()` : Retour aujourd'hui

### `useToast()`
Affiche des notifications toast.

**Retourne :**
- `toast` : Notification actuelle
- `showToast(message, type)` : Afficher toast

## 🧩 Composants

### `PlannerHeader`
Affiche le titre, la période, et les contrôles de vue (list/focus).

### `WeekProgressCard`
Carte avec :
- Numéro de semaine
- Progression circulaire (%)
- Stats (repas planifiés / restants)
- Navigation semaine

### `DayGridSelector`
Grille de 7 jours cliquables pour sélectionner un jour.

### `DayMealCard` ⭐
**Composant réutilisable** pour afficher/éditer un repas :
- Icône (sun/moon)
- Input texte
- Bouton recette picker
- États : vide / rempli

### `FocusView`
Affiche le jour sélectionné avec ses 2 repas (déjeuner/dîner).

### `ListView`
Affiche les 7 jours de la semaine avec tous les repas.

### `WeekPickerModal`
Modal calendrier pour :
- Raccourcis (cette semaine / prochaine)
- Navigation mois
- Vue calendrier avec indicateurs de planning

### `RecipePickerModal`
Modal pour ajouter un repas :
- Entrée libre (texte)
- Recherche dans la bibliothèque
- Sélection recette

## 🎨 Styles

Les styles sont centralisés dans `features/planner/styles.ts` et utilisés comme :
```tsx
import { styles as sharedStyles } from "../../features/planner/styles";
```

Chaque composant a aussi ses propres styles locaux.

## 📦 Utilisation

```tsx
import PlannerScreen from "./planner.tsx";
// ou via le système de routing Expo
```

## 🔄 Flux de Données

1. **Chargement initial** :
   - `useAuth()` → session
   - `useWeekNavigation()` → dates
   - `usePlannerData()` → charge le menu de la semaine
   - `useRecipes()` → charge les recettes

2. **Modification d'un repas** :
   - User tape dans `DayMealCard`
   - `handleDayChange()` met à jour l'état local
   - Clic "Enregistrer" → `handleSave()` → Supabase

3. **Changement de semaine** :
   - Navigation (`handleNavigate()`)
   - `referenceDate` change
   - `usePlannerData()` recharge les données

## ⚡ Optimisations

- **Hooks mémorisés** : Évitent les re-renders inutiles
- **Composants découplés** : Moins de propagation d'état
- **Lazy state** : Les modals ne sont montés que si visibles
- **Cancellation** : Les requêtes sont annulées si le composant unmount

## 🧪 Tests (À venir)

Exemples de tests à implémenter :
```tsx
// hooks/usePlannerData.test.ts
describe("usePlannerData", () => {
  it("should load week menu on mount", async () => {
    // ...
  });
});

// components/DayMealCard.test.tsx
describe("DayMealCard", () => {
  it("should display empty state when no recipe", () => {
    // ...
  });
});
```

## 📝 Notes de Migration

L'ancien fichier `planner.tsx` (2890 lignes) a été sauvegardé en `planner.tsx.backup`.

**Changements majeurs :**
- ✅ Même fonctionnalités (100% compatible)
- ✅ Même UI/UX
- ✅ Mêmes props/types
- ✅ Pas de breaking changes

**Avantages :**
- 📦 Modules réutilisables
- 🧪 Testable unitairement
- 📖 Code lisible et documenté
- ⚡ Performances optimisées
- 🔧 Maintenabilité améliorée

## 🤝 Contribution

Pour ajouter une nouvelle fonctionnalité :

1. **Logique métier** → Créer un hook dans `hooks/`
2. **Composant UI** → Créer dans `components/`
3. **Types** → Ajouter dans `utils/types.ts`
4. **Intégration** → Importer dans `planner.tsx`

Exemple :
```tsx
// 1. Créer le hook
// hooks/useShoppingList.ts
export const useShoppingList = () => { ... }

// 2. Créer le composant
// components/ShoppingListModal.tsx
export const ShoppingListModal = () => { ... }

// 3. Intégrer
// planner.tsx
import { useShoppingList } from "../../features/planner/hooks/useShoppingList";
import { ShoppingListModal } from "../../features/planner/components/ShoppingListModal";
```

---

**Refactorisé le** : 2026-01-16
**Version** : 1.0.0
