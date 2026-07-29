export type Difficulty = "Facile" | "Moyen" | "Expert";
export type IngredientUnit = "pièce" | "unité" | "ml" | "gr";

export type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
};

export type RecipeStep = {
  id: string;
  order: number;
  text: string;
};

export type Recipe = {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  servings: number;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  sourceUrl: string;
  imageUrls: string[];
  coverImageUrl: string;
};

export type RecipeFormState = {
  title: string;
  duration: string;
  description: string;
  servings: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  sourceUrl: string;
  imageUrls: string[];
  coverImageUrl: string;
};

export type RecipeInput = {
  title: string;
  duration: string;
  description: string;
  servings: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  source_url: string | null;
  image_urls: string[];
  cover_image_url: string | null;
};

export const DIFFICULTIES: Difficulty[] = ["Facile", "Moyen", "Expert"];
export const INGREDIENT_UNITS: IngredientUnit[] = ["pièce", "unité", "ml", "gr"];

export const createIngredient = (): Ingredient => ({
  id: String(Date.now() + Math.random()),
  name: "",
  quantity: "",
  unit: "pièce",
});

export const createRecipeStep = (order = 1): RecipeStep => ({
  id: String(Date.now() + Math.random()),
  order,
  text: "",
});

const cleanStepText = (value: string): string =>
  value
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

export const parseStepsFromDescription = (description: string): RecipeStep[] =>
  description
    .split(/\r?\n/)
    .map(cleanStepText)
    .filter(Boolean)
    .map((text, index) => ({
      id: String(Date.now() + Math.random() + index),
      order: index + 1,
      text,
    }));

export const sanitizeRecipeSteps = (
  value: unknown,
  fallbackDescription = ""
): RecipeStep[] => {
  const source = Array.isArray(value)
    ? value
    : parseStepsFromDescription(fallbackDescription);

  const steps = source
    .map((entry, index) => {
      if (typeof entry === "string") {
        const text = cleanStepText(entry);
        return text
          ? {
              id: String(Date.now() + Math.random() + index),
              order: index + 1,
              text,
            }
          : null;
      }

      if (!entry || typeof entry !== "object") return null;

      const raw = entry as Partial<RecipeStep>;
      const text = typeof raw.text === "string" ? cleanStepText(raw.text) : "";
      if (!text) return null;

      return {
        id: typeof raw.id === "string" ? raw.id : String(Date.now() + Math.random() + index),
        order: typeof raw.order === "number" && raw.order > 0 ? raw.order : index + 1,
        text,
      };
    })
    .filter((item): item is RecipeStep => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index + 1 }));

  return steps.length ? steps : [createRecipeStep()];
};

export const sanitizeImageUrls = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const mapRecipe = (row: {
  id: string | number;
  title: string;
  duration?: string | null;
  difficulty: string;
  servings?: number | null;
  description?: string | null;
  ingredients?: Ingredient[] | null;
  steps?: RecipeStep[] | string[] | null;
  source_url?: string | null;
  sourceUrl?: string | null;
  image_urls?: string[] | null;
  imageUrls?: string[] | null;
  cover_image_url?: string | null;
  coverImageUrl?: string | null;
}): Recipe => ({
  id: String(row.id),
  title: row.title,
  duration: row.duration ?? "",
  difficulty: (row.difficulty as Difficulty) ?? "Facile",
  servings: row.servings ?? 1,
  description: row.description ?? "",
  ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
  steps: sanitizeRecipeSteps(row.steps, row.description ?? ""),
  sourceUrl: row.source_url ?? row.sourceUrl ?? "",
  imageUrls: sanitizeImageUrls(row.image_urls ?? row.imageUrls),
  coverImageUrl:
    row.cover_image_url ??
    row.coverImageUrl ??
    sanitizeImageUrls(row.image_urls ?? row.imageUrls)[0] ??
    "",
});

export const createEmptyFormState = (): RecipeFormState => ({
  title: "",
  duration: "",
  description: "",
  servings: "2",
  difficulty: "Facile",
  ingredients: [createIngredient()],
  steps: [createRecipeStep()],
  sourceUrl: "",
  imageUrls: [],
  coverImageUrl: "",
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
  steps: sanitizeRecipeSteps(recipe.steps, recipe.description),
  sourceUrl: recipe.sourceUrl ?? "",
  imageUrls: sanitizeImageUrls(recipe.imageUrls),
  coverImageUrl: recipe.coverImageUrl || recipe.imageUrls[0] || "",
});
