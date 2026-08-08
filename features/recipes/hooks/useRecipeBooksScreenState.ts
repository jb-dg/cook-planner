import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  buildBooksStorageKey,
  buildRecipeBooks,
  parseStoredBooks,
  type CustomBook,
  type RecipeBook,
} from "@/features/recipes/books";
import { fetchHouseholdScope, type HouseholdScope } from "@/lib/households";
import { supabase } from "@/lib/supabase";

import { mapRecipe, type Recipe } from "../types";

type RecipeRow = Parameters<typeof mapRecipe>[0];

const RECIPE_SELECT_WITH_IMAGES =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url";
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
  const [bookError, setBookError] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    if (!session || !scope) return null;
    return buildBooksStorageKey(session.user.id, scope.householdId);
  }, [session, scope]);

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

  useEffect(() => {
    let cancelled = false;
    if (!storageKey) {
      setCustomBooks([]);
      setBooksLoading(false);
      return;
    }

    setBooksLoading(true);
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (cancelled) return;
        setCustomBooks(parseStoredBooks(value));
      })
      .catch((storageError) => {
        console.error("load recipe books", storageError);
        if (!cancelled) {
          setCustomBooks([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBooksLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || booksLoading) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(customBooks)).catch(
      (storageError) => {
        console.error("save recipe books", storageError);
      },
    );
  }, [storageKey, booksLoading, customBooks]);

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

  const handleCreateBook = useCallback(() => {
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

    const id = `book-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setCustomBooks((prev) => [{ id, name, recipeIds: [] }, ...prev]);
    setBookName("");
    setBookError(null);
  }, [bookName, books]);

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
    bookError,
    selectedBook,
    selectedBookId,
    selectedRecipe,
    displayedRecipes,
    onBookNameChange,
    handleCreateBook,
    handleOpenBook,
    handleOpenRecipe,
    handleCloseRecipeModal,
    handleOpenCreateRecipe,
    handleCreateRecipeInBook,
    handleRefresh,
  };
};
