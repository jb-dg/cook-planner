import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  buildRecipeBooks,
  createCustomBook,
  deleteCustomBook,
  fetchCustomBooks,
  moveRecipeToBook as moveRecipeToBookApi,
  renameCustomBook,
  updateCustomBookEmoji,
  updateCustomBookSharing,
  type CustomBook,
  type RecipeBook,
} from "@/features/recipes/books";
import { fetchHouseholdScope, type HouseholdScope } from "@/lib/households";
import { supabase } from "@/lib/supabase";

import { mapRecipe, type Recipe } from "../types";

type RecipeRow = Parameters<typeof mapRecipe>[0];

const RECIPE_SELECT_WITH_IMAGES =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url,book_id";
const RECIPE_SELECT_BASIC =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url";

export const useRecipeBooksScreenState = () => {
  const { session } = useAuth();
  const router = useRouter();

  const [scope, setScope] = useState<HouseholdScope | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookName, setBookName] = useState("");
  const [bookEmoji, setBookEmoji] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const hasHousehold = !!scope?.householdId;

  const fetchRecipes = useCallback(async () => {
    if (!session) {
      setScope(null);
      setRecipes([]);
      return;
    }

    setError(null);
    try {
      const nextScope = await fetchHouseholdScope(session.user.id);
      setScope(nextScope);
      const primary = await supabase
        .from("recipes")
        .select(RECIPE_SELECT_WITH_IMAGES)
        .eq(nextScope.filterColumn, nextScope.filterValue)
        .order("created_at", { ascending: false });
      let data = primary.data as RecipeRow[] | null;
      let fetchError = primary.error;

      if (fetchError?.code === "42703") {
        const fallback = await supabase
          .from("recipes")
          .select(RECIPE_SELECT_BASIC)
          .eq(nextScope.filterColumn, nextScope.filterValue)
          .order("created_at", { ascending: false });

        data = fallback.data as RecipeRow[] | null;
        fetchError = fallback.error;
      }

      if (fetchError) {
        throw fetchError;
      }
      setRecipes((data ?? []).map(mapRecipe));
    } catch (err) {
      console.error("fetch recipes", err);
      setError("Impossible de charger tes recettes.");
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      setRecipes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchRecipes()
      .catch(() => {
        // handled
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, fetchRecipes]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      fetchRecipes();
    }, [session, fetchRecipes]),
  );

  const loadBooks = useCallback(async (cancelRef?: { cancelled: boolean }) => {
    if (!session) {
      setCustomBooks([]);
      setBooksLoading(false);
      return;
    }

    setBooksLoading(true);
    try {
      const books = await fetchCustomBooks();
      if (cancelRef?.cancelled) return;
      setCustomBooks(books);
    } catch (fetchErr) {
      console.error("load recipe books", fetchErr);
      if (!cancelRef?.cancelled) {
        setCustomBooks([]);
      }
    } finally {
      if (!cancelRef?.cancelled) {
        setBooksLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    const cancelRef = { cancelled: false };
    loadBooks(cancelRef);
    return () => {
      cancelRef.cancelled = true;
    };
  }, [loadBooks]);

  // Custom book renames/deletes made from the phone's dedicated
  // `books/[bookId]` screen live in that screen's own local state, not
  // here — without this, coming back to this list after deleting a book
  // there still showed the stale, since-deleted book until the app
  // reloaded.
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      const cancelRef = { cancelled: false };
      loadBooks(cancelRef);
      return () => {
        cancelRef.cancelled = true;
      };
    }, [session, loadBooks]),
  );

  const books = useMemo<RecipeBook[]>(
    () =>
      buildRecipeBooks({
        recipes,
        customBooks,
        householdId: scope?.householdId ?? null,
      }),
    [recipes, customBooks, scope?.householdId],
  );

  const booksCountLabel = useMemo(() => {
    const count = books.length;
    if (count === 1) return "1 livre";
    return `${count} livres`;
  }, [books.length]);

  const selectedBook = useMemo(() => {
    if (!books.length) return null;
    return books.find((book) => book.id === selectedBookId) ?? books[0];
  }, [books, selectedBookId]);

  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes],
  );

  const displayedRecipes = useMemo(() => {
    if (!selectedBook) return [];
    return selectedBook.recipeIds
      .map((id) => recipesById.get(id))
      .filter((recipe): recipe is Recipe => !!recipe);
  }, [recipesById, selectedBook]);

  // Only meaningful for a custom (non-system) book — the system book
  // already contains every recipe, so there's nothing to add to it.
  const activeCustomBook = useMemo(() => {
    if (!selectedBook || selectedBook.isSystem) return null;
    return customBooks.find((book) => book.id === selectedBook.id) ?? null;
  }, [selectedBook, customBooks]);

  const availableRecipes = useMemo(() => {
    if (!activeCustomBook || !selectedBook) return [];
    const ids = new Set(selectedBook.recipeIds);
    return recipes.filter((recipe) => !ids.has(recipe.id));
  }, [activeCustomBook, selectedBook, recipes]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipesById.get(selectedRecipeId) ?? null;
  }, [recipesById, selectedRecipeId]);

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchRecipes();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchRecipes]);

  const handleCreateBook = useCallback(async () => {
    if (!session) return;
    const name = bookName.trim();
    if (!name) {
      setBookError("Donne un nom au livre.");
      return;
    }

    const duplicate = books.some(
      (book) => book.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setBookError("Ce nom de livre existe déjà.");
      return;
    }

    try {
      const created = await createCustomBook({
        ownerId: session.user.id,
        name,
        householdId: isShared ? scope?.householdId ?? null : null,
        emoji: bookEmoji.trim() || null,
      });
      setCustomBooks((prev) => [created, ...prev]);
      setBookName("");
      setBookEmoji("");
      setIsShared(false);
      setBookError(null);
    } catch (err) {
      console.error("create recipe book", err);
      setBookError("Impossible de créer le livre. Réessaie plus tard.");
    }
  }, [session, bookName, bookEmoji, isShared, scope?.householdId, books]);

  const onBookEmojiChange = useCallback((value: string) => {
    setBookEmoji(value);
  }, []);

  const onIsSharedChange = useCallback((value: boolean) => {
    setIsShared(value);
  }, []);

  const handleRenameBook = useCallback(
    async (book: RecipeBook, name: string) => {
      if (book.isSystem) return;

      const trimmed = name.trim();
      if (!trimmed) {
        setRenameError("Donne un nom au livre.");
        return;
      }

      const duplicate = books.some(
        (other) =>
          other.id !== book.id && other.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) {
        setRenameError("Ce nom de livre existe déjà.");
        return;
      }

      try {
        await renameCustomBook(book.id, trimmed);
        setCustomBooks((prev) =>
          prev.map((entry) => (entry.id === book.id ? { ...entry, name: trimmed } : entry)),
        );
        setRenameError(null);
      } catch (err) {
        console.error("rename recipe book", err);
        setRenameError("Impossible de renommer le livre. Réessaie plus tard.");
      }
    },
    [books],
  );

  const handleUpdateBookEmoji = useCallback(async (book: RecipeBook, emoji: string) => {
    if (book.isSystem) return;
    const trimmedEmoji = emoji.trim() || null;
    try {
      await updateCustomBookEmoji(book.id, trimmedEmoji);
      setCustomBooks((prev) =>
        prev.map((entry) => (entry.id === book.id ? { ...entry, emoji: trimmedEmoji } : entry)),
      );
    } catch (err) {
      console.error("update book emoji", err);
    }
  }, []);

  const handleUpdateBookSharing = useCallback(
    async (book: RecipeBook, shared: boolean) => {
      if (book.isSystem) return;
      const targetHouseholdId = shared ? scope?.householdId ?? null : null;
      try {
        await updateCustomBookSharing(book.id, targetHouseholdId);
        setCustomBooks((prev) =>
          prev.map((entry) =>
            entry.id === book.id ? { ...entry, householdId: targetHouseholdId } : entry,
          ),
        );
      } catch (err) {
        console.error("update book sharing", err);
      }
    },
    [scope?.householdId],
  );

  const handleDeleteBook = useCallback(
    async (book: RecipeBook) => {
      if (book.isSystem) return;
      try {
        await deleteCustomBook(book.id);
        setCustomBooks((prev) => prev.filter((entry) => entry.id !== book.id));
        // Falls back to the system book: selectedBook re-derives from
        // `books[0]` once the deleted id no longer matches anything.
        setSelectedBookId((current) => (current === book.id ? null : current));
        // Recipes that were in the deleted book had their book_id cleared
        // server-side (ON DELETE SET NULL) — refetch so local state matches.
        fetchRecipes();
      } catch (err) {
        console.error("delete recipe book", err);
      }
    },
    [fetchRecipes],
  );

  const handleAddRecipeToBook = useCallback(
    async (recipeId: string) => {
      if (!activeCustomBook) return;
      try {
        await moveRecipeToBookApi(recipeId, activeCustomBook.id);
        setRecipes((prev) =>
          prev.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, bookId: activeCustomBook.id } : recipe,
          ),
        );
      } catch (err) {
        console.error("add recipe to book", err);
      }
    },
    [activeCustomBook],
  );

  const onBookNameChange = useCallback(
    (value: string) => {
      setBookName(value);
      if (bookError) {
        setBookError(null);
      }
    },
    [bookError],
  );

  const handleOpenBook = useCallback(
    (book: RecipeBook) => {
      router.push({
        pathname: "/(tabs)/recipes/books/[bookId]",
        params: { bookId: book.id },
      });
    },
    [router],
  );

  // iPad split view: select a book in place instead of navigating to the
  // phone's dedicated book-detail screen.
  const handleSelectBook = useCallback((book: RecipeBook) => {
    setSelectedBookId(book.id);
  }, []);

  const handleOpenRecipe = useCallback(
    (recipeId: string, actionMode: "view" | "edit") => {
      if (actionMode === "view") {
        setSelectedRecipeId(recipeId);
        return;
      }

      router.push({
        pathname: "/(tabs)/recipes/[id]",
        params: { id: recipeId, mode: actionMode },
      });
    },
    [router],
  );

  const handleCloseRecipeModal = useCallback(() => {
    setSelectedRecipeId(null);
  }, []);

  const handleOpenCreateRecipe = useCallback(() => {
    router.push("/(tabs)/recipes/create");
  }, [router]);

  const handleOpenExplore = useCallback(() => {
    router.push("/(tabs)/recipes/explore");
  }, [router]);

  const handleCreateRecipeInBook = useCallback(() => {
    if (!selectedBook) return;
    router.push({
      pathname: "/(tabs)/recipes/create",
      params: { bookId: selectedBook.id },
    });
  }, [router, selectedBook]);

  return {
    loading,
    booksLoading,
    refreshing,
    error,
    recipes,
    books,
    booksCountLabel,
    bookName,
    bookEmoji,
    bookError,
    renameError,
    hasHousehold,
    isShared,
    selectedBook,
    selectedBookId,
    selectedRecipe,
    displayedRecipes,
    availableRecipes,
    onBookNameChange,
    onBookEmojiChange,
    onIsSharedChange,
    handleCreateBook,
    handleRenameBook,
    handleUpdateBookEmoji,
    handleUpdateBookSharing,
    handleDeleteBook,
    handleAddRecipeToBook,
    handleOpenBook,
    handleSelectBook,
    handleOpenRecipe,
    handleCloseRecipeModal,
    handleOpenCreateRecipe,
    handleOpenExplore,
    handleCreateRecipeInBook,
    handleRefresh,
  };
};
