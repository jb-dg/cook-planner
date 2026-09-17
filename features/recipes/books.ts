import { supabase } from "@/lib/supabase";

import { Recipe } from "./types";

export type CustomBook = {
  id: string;
  name: string;
  householdId: string | null;
  emoji: string | null;
};

export type RecipeBook = {
  id: string;
  name: string;
  recipeIds: string[];
  isSystem: boolean;
  isShared: boolean;
  emoji: string | null;
};

export const SYSTEM_BOOK_ID = "household-book";

type RecipeBookRow = {
  id: string;
  name: string;
  household_id: string | null;
  emoji?: string | null;
};

const mapCustomBook = (row: RecipeBookRow): CustomBook => ({
  id: row.id,
  name: row.name,
  householdId: row.household_id,
  emoji: row.emoji ?? null,
});

const RECIPE_BOOK_SELECT = "id,name,household_id,emoji";

// RLS already restricts rows to the caller's own books plus any books
// shared with their household, so no extra filter is needed here.
export const fetchCustomBooks = async (): Promise<CustomBook[]> => {
  const { data, error } = await supabase
    .from("recipe_books")
    .select(RECIPE_BOOK_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCustomBook);
};

export const createCustomBook = async ({
  ownerId,
  name,
  householdId,
  emoji,
}: {
  ownerId: string;
  name: string;
  householdId: string | null;
  emoji?: string | null;
}): Promise<CustomBook> => {
  const { data, error } = await supabase
    .from("recipe_books")
    .insert({ owner_id: ownerId, name, household_id: householdId, emoji: emoji ?? null })
    .select(RECIPE_BOOK_SELECT)
    .single();

  if (error) throw error;
  return mapCustomBook(data);
};

export const renameCustomBook = async (bookId: string, name: string): Promise<void> => {
  const { error } = await supabase.from("recipe_books").update({ name }).eq("id", bookId);
  if (error) throw error;
};

export const updateCustomBookEmoji = async (
  bookId: string,
  emoji: string | null,
): Promise<void> => {
  const { error } = await supabase
    .from("recipe_books")
    .update({ emoji })
    .eq("id", bookId);
  if (error) throw error;
};

// Re-sharing/re-privatizing an existing book: pass the household id to share
// it, or null to make it private again. Only meaningful for a household
// member — the caller is responsible for only offering this when relevant.
export const updateCustomBookSharing = async (
  bookId: string,
  householdId: string | null,
): Promise<void> => {
  const { error } = await supabase
    .from("recipe_books")
    .update({ household_id: householdId })
    .eq("id", bookId);
  if (error) throw error;
};

export const deleteCustomBook = async (bookId: string): Promise<void> => {
  const { error } = await supabase.from("recipe_books").delete().eq("id", bookId);
  if (error) throw error;
};

// Moves a recipe to `targetBookId` (or clears its book when passed
// SYSTEM_BOOK_ID, since the system book isn't a real row) — a recipe
// belongs to at most one custom book at a time via recipes.book_id.
export const moveRecipeToBook = async (
  recipeId: string,
  targetBookId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("recipes")
    .update({ book_id: targetBookId === SYSTEM_BOOK_ID ? null : targetBookId })
    .eq("id", recipeId);

  if (error) throw error;
};

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
  const systemBook: RecipeBook = {
    id: SYSTEM_BOOK_ID,
    name: householdId ? "Recettes du foyer" : "Toutes les recettes",
    recipeIds: recipes.map((recipe) => recipe.id),
    isSystem: true,
    isShared: !!householdId,
    emoji: null,
  };

  const customBookList: RecipeBook[] = customBooks.map((book) => ({
    id: book.id,
    name: book.name,
    recipeIds: recipes
      .filter((recipe) => recipe.bookId === book.id)
      .map((recipe) => recipe.id),
    isSystem: false,
    isShared: !!book.householdId,
    emoji: book.emoji,
  }));

  return [systemBook, ...customBookList];
};
