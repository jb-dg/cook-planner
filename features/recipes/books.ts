import { Recipe } from "./types";

export type CustomBook = {
  id: string;
  name: string;
  recipeIds: string[];
};

export type RecipeBook = {
  id: string;
  name: string;
  recipeIds: string[];
  isSystem: boolean;
};

export const SYSTEM_BOOK_ID = "household-book";

export const buildBooksStorageKey = (userId: string, householdId: string | null) =>
  `recipe-books:${householdId ?? `user-${userId}`}`;

export const parseStoredBooks = (value: string | null): CustomBook[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          Array.isArray(item.recipeIds),
      )
      .map((item) => ({
        id: item.id as string,
        name: item.name as string,
        recipeIds: (item.recipeIds as unknown[]).filter(
          (id): id is string => typeof id === "string",
        ),
      }));
  } catch {
    return [];
  }
};

// Moves a recipe to `targetBookId`, removing it from whichever custom book
// (if any) currently holds it first — a recipe belongs to at most one
// custom book at a time. Passing SYSTEM_BOOK_ID as the target just clears
// membership, since the system book isn't tracked in customBooks.
export const moveRecipeToBook = (
  customBooks: CustomBook[],
  recipeId: string,
  targetBookId: string,
): CustomBook[] =>
  customBooks.map((book) => {
    const withoutRecipe = book.recipeIds.filter((id) => id !== recipeId);
    if (book.id !== targetBookId) {
      return withoutRecipe.length === book.recipeIds.length
        ? book
        : { ...book, recipeIds: withoutRecipe };
    }
    return {
      ...book,
      recipeIds: [recipeId, ...withoutRecipe],
    };
  });

type BuildRecipeBooksArgs = {
  recipes: Recipe[];
  customBooks: CustomBook[];
  householdId: string | null;
};

export const buildRecipeBooks = ({
  recipes,
  customBooks,
  householdId,
}: BuildRecipeBooksArgs): RecipeBook[] => {
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const systemBook: RecipeBook = {
    id: SYSTEM_BOOK_ID,
    name: householdId ? "Recettes du foyer" : "Toutes les recettes",
    recipeIds: recipes.map((recipe) => recipe.id),
    isSystem: true,
  };

  const sanitizedCustomBooks = customBooks.map((book) => ({
    id: book.id,
    name: book.name,
    recipeIds: book.recipeIds.filter((recipeId) => recipeIds.has(recipeId)),
    isSystem: false,
  }));

  return [systemBook, ...sanitizedCustomBooks];
};
