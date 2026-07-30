import type { Recipe } from "@/features/recipes/types";

import type { MergeableIngredient } from "./mergeIngredients";

export type ShoppingListItemSource = "manual" | "recipe" | "planner";

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  isChecked: boolean;
  source: ShoppingListItemSource;
  recipeId: string | null;
  createdAt: string;
};

export type ShoppingListItemRow = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  is_checked: boolean;
  source: ShoppingListItemSource;
  recipe_id: string | null;
  created_at: string;
};

export const mapShoppingListItem = (
  row: ShoppingListItemRow,
): ShoppingListItem => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity,
  unit: row.unit,
  isChecked: row.is_checked,
  source: row.source,
  recipeId: row.recipe_id,
  createdAt: row.created_at,
});

export const ingredientsFromRecipe = (
  recipe: Pick<Recipe, "ingredients">,
): MergeableIngredient[] =>
  recipe.ingredients
    .map((ingredient) => ({
      name: ingredient.name.trim(),
      quantity: ingredient.quantity?.trim() || null,
      unit: ingredient.unit ?? null,
    }))
    .filter((ingredient) => ingredient.name.length > 0);
