export type Difficulty = "Facile" | "Moyen" | "Expert";
export type IngredientUnit = "pièce" | "ml" | "gr";

export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
};

export type Recipe = {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  servings: number;
  description: string;
  ingredients: Ingredient[];
};

export type RecipeFormState = {
  title: string;
  duration: string;
  description: string;
  servings: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
};

export type RecipeInput = {
  title: string;
  duration: string;
  description: string;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
};

export const DIFFICULTIES: Difficulty[] = ["Facile", "Moyen", "Expert"];
export const INGREDIENT_UNITS: IngredientUnit[] = ["pièce", "ml", "gr"];

export const createIngredient = (): Ingredient => ({
  id: String(Date.now() + Math.random()),
  name: "",
  quantity: "",
  unit: "pièce",
});

export const mapRecipe = (row: {
  id: string | number;
  title: string;
  duration?: string | null;
  difficulty: string;
  servings?: number | null;
  description?: string | null;
  ingredients?: Ingredient[] | null;
}): Recipe => ({
  id: String(row.id),
  title: row.title,
  duration: row.duration ?? "",
  difficulty: (row.difficulty as Difficulty) ?? "Facile",
  servings: row.servings ?? 1,
  description: row.description ?? "",
  ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
});

export const createEmptyFormState = (): RecipeFormState => ({
  title: "",
  duration: "",
  description: "",
  servings: "2",
  difficulty: "Facile",
  ingredients: [createIngredient()],
});

export const recipeToFormState = (recipe: Recipe): RecipeFormState => ({
  title: recipe.title,
  duration: recipe.duration ?? "",
  description: recipe.description ?? "",
  servings: String(recipe.servings ?? 1),
  difficulty: recipe.difficulty ?? "Facile",
  ingredients:
    recipe.ingredients.length > 0
      ? recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          id: ingredient.id
            ? String(ingredient.id)
            : String(Date.now() + Math.random()),
        }))
      : [createIngredient()],
});
