import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../contexts/AuthContext";
import PhysicalButtonAnimated from "../../../../components/PhysicalButtonAnimated";
import PhysicalIconButton from "../../../../components/PhysicalIconButton";
import AddRecipesToBookModal from "../../../../features/recipes/components/AddRecipesToBookModal";
import RecipeCard from "../../../../features/recipes/components/RecipeCard";
import RecipeViewModal from "../../../../features/recipes/components/RecipeViewModal";
import {
  buildBooksStorageKey,
  buildRecipeBooks,
  CustomBook,
  parseStoredBooks,
  RecipeBook,
} from "../../../../features/recipes/books";
import { mapRecipe, Recipe } from "../../../../features/recipes/types";
import { fetchHouseholdScope, HouseholdScope } from "../../../../lib/households";
import { supabase } from "../../../../lib/supabase";
import { colors, spacing } from "../../../../theme/design";

type RecipeRow = Parameters<typeof mapRecipe>[0];

const RECIPE_SELECT_WITH_IMAGES =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url";
const RECIPE_SELECT_BASIC =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url";

export default function RecipeBookScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const currentBookId = Array.isArray(bookId) ? bookId[0] : bookId;

  const [scope, setScope] = useState<HouseholdScope | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [booksLoading, setBooksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [addRecipesModalVisible, setAddRecipesModalVisible] = useState(false);

  // null = not editing. Tied to the viewed book, so navigating to a
  // different book discards an in-progress edit instead of leaving stale UI.
  const [editingName, setEditingName] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  useEffect(() => {
    setEditingName(null);
    setRenameError(null);
  }, [currentBookId]);

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
        /* handled */
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

  const selectedBook = useMemo(
    () => books.find((book) => book.id === currentBookId) ?? null,
    [books, currentBookId],
  );

  const displayedRecipes = useMemo(() => {
    if (!selectedBook) return [];
    if (selectedBook.isSystem) return recipes;
    const ids = new Set(selectedBook.recipeIds);
    return recipes.filter((recipe) => ids.has(recipe.id));
  }, [selectedBook, recipes]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null;
  }, [recipes, selectedRecipeId]);

  const activeCustomBook = useMemo(() => {
    if (!selectedBook || selectedBook.isSystem) return null;
    return customBooks.find((book) => book.id === selectedBook.id) ?? null;
  }, [selectedBook, customBooks]);

  const availableRecipes = useMemo(() => {
    if (!activeCustomBook) return [];
    const ids = new Set(activeCustomBook.recipeIds);
    return recipes.filter((recipe) => !ids.has(recipe.id));
  }, [activeCustomBook, recipes]);

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchRecipes();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchRecipes]);

  const handleBackToRecipes = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/recipes");
  };

  const handleOpenRecipe = (recipeId: string, mode: "view" | "edit") => {
    if (mode === "view") {
      setSelectedRecipeId(recipeId);
      return;
    }

    router.push({
      pathname: "/(tabs)/recipes/[id]",
      params: { id: recipeId, mode },
    });
  };

  const handleCreateRecipeInBook = () => {
    if (!selectedBook) return;
    router.push({
      pathname: "/(tabs)/recipes/create",
      params: { bookId: selectedBook.id },
    });
  };

  const handleAddRecipeToBook = (recipeId: string) => {
    if (!activeCustomBook) return;
    setCustomBooks((prev) =>
      prev.map((book) => {
        if (book.id !== activeCustomBook.id) return book;
        if (book.recipeIds.includes(recipeId)) return book;
        return { ...book, recipeIds: [recipeId, ...book.recipeIds] };
      }),
    );
  };

  const handleRemoveRecipeFromBook = (recipeId: string) => {
    if (!activeCustomBook) return;
    setCustomBooks((prev) =>
      prev.map((book) => {
        if (book.id !== activeCustomBook.id) return book;
        return { ...book, recipeIds: book.recipeIds.filter((id) => id !== recipeId) };
      }),
    );
  };

  const startRename = () => {
    if (!selectedBook) return;
    setEditingName(selectedBook.name);
    setRenameError(null);
  };

  const cancelRename = () => {
    setEditingName(null);
    setRenameError(null);
  };

  const confirmRename = () => {
    if (!selectedBook || editingName === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setRenameError("Donne un nom au livre.");
      return;
    }
    const duplicate = books.some(
      (other) =>
        other.id !== selectedBook.id &&
        other.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setRenameError("Ce nom de livre existe déjà.");
      return;
    }

    setCustomBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id ? { ...book, name: trimmed } : book,
      ),
    );
    setEditingName(null);
    setRenameError(null);
  };

  const confirmDeleteBook = () => {
    if (!selectedBook) return;
    Alert.alert(
      "Supprimer le livre",
      `Supprimer "${selectedBook.name}" ? Les recettes elles-mêmes ne seront pas supprimées.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            setCustomBooks((prev) =>
              prev.filter((book) => book.id !== selectedBook.id),
            );
            handleBackToRecipes();
          },
        },
      ],
    );
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard
      recipe={item}
      onView={() => handleOpenRecipe(item.id, "view")}
      removable={!!activeCustomBook}
      onRemove={() => handleRemoveRecipeFromBook(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* No book name here — the heading right below in the list already
          shows it, and both were visible on screen at once before any
          scrolling happened. */}
      <View style={styles.stickyHeader}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.cardPressed]}
          onPress={handleBackToRecipes}
        >
          <Feather name="chevron-left" size={16} color="#6B705C" />
          <Text style={styles.backButtonText}>Tous les livres</Text>
        </Pressable>
      </View>
      <FlatList
        data={displayedRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.header}>
            {editingName !== null ? (
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                autoFocus
                style={styles.renameInput}
                onSubmitEditing={confirmRename}
                returnKeyType="done"
              />
            ) : (
              <Text style={styles.heading}>{selectedBook?.name ?? "Livre"}</Text>
            )}
            {renameError && editingName !== null ? (
              <Text style={styles.errorText}>{renameError}</Text>
            ) : (
              <Text style={styles.subtitle}>
                {selectedBook
                    ? `${displayedRecipes.length} recette${
                      displayedRecipes.length > 1 ? "s" : ""
                    } dans ce livre`
                  : "Livre introuvable"}
              </Text>
            )}
            {selectedBook ? (
              <View style={styles.headerActionsRow}>
                {editingName !== null ? (
                  <>
                    <PhysicalIconButton
                      variant="secondary"
                      onPress={confirmRename}
                      accessibilityLabel="Enregistrer le nom du livre"
                    >
                      <Feather name="check" size={16} color={colors.accent} />
                    </PhysicalIconButton>
                    <PhysicalIconButton
                      variant="secondary"
                      onPress={cancelRename}
                      accessibilityLabel="Annuler"
                    >
                      <Feather name="x" size={16} color="#6B705C" />
                    </PhysicalIconButton>
                  </>
                ) : (
                  <>
                    <View style={styles.createRecipeButtonWrapper}>
                      <PhysicalButtonAnimated
                        variant="primary"
                        onPress={handleCreateRecipeInBook}
                        innerStyle={styles.createRecipeButtonInner}
                      >
                        <Feather name="plus" size={14} color="#FFFFFF" />
                        <Text style={styles.createRecipeButtonText}>
                          Nouvelle recette
                        </Text>
                      </PhysicalButtonAnimated>
                    </View>
                    {activeCustomBook ? (
                      <PhysicalIconButton
                        variant="secondary"
                        onPress={() => setAddRecipesModalVisible(true)}
                        accessibilityLabel="Ajouter des recettes au livre"
                      >
                        <Feather name="bookmark" size={14} color="#6B705C" />
                      </PhysicalIconButton>
                    ) : null}
                    {!selectedBook.isSystem ? (
                      <>
                        <PhysicalIconButton
                          variant="secondary"
                          onPress={startRename}
                          accessibilityLabel="Modifier le nom du livre"
                        >
                          <Feather name="edit-2" size={14} color="#6B705C" />
                        </PhysicalIconButton>
                        <PhysicalIconButton
                          variant="secondary"
                          onPress={confirmDeleteBook}
                          accessibilityLabel="Supprimer le livre"
                        >
                          <Feather name="trash-2" size={14} color={colors.danger} />
                        </PhysicalIconButton>
                      </>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading || booksLoading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.accentSecondary}
              size="large"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {selectedBook ? "Ce livre est vide" : "Livre introuvable"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedBook
                  ? "Ajoute des recettes dans ce livre depuis l’écran des livres."
                  : "Retourne à la liste des livres et ouvre un livre existant."}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
      <RecipeViewModal
        visible={!!selectedRecipe}
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipeId(null)}
        onEdit={(recipeId) => {
          setSelectedRecipeId(null);
          handleOpenRecipe(recipeId, "edit");
        }}
      />
      <AddRecipesToBookModal
        visible={addRecipesModalVisible}
        bookName={selectedBook?.name ?? "Livre"}
        availableRecipes={availableRecipes}
        onAdd={handleAddRecipeToBook}
        onClose={() => setAddRecipesModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.screen,
    paddingBottom: 140,
    gap: 14,
  },
  stickyHeader: {
    paddingHorizontal: spacing.screen,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(107,112,92,0.24)",
    gap: 4,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "700",
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  subtitle: {
    color: "#6B705C",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  renameInput: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#FCFAF7",
    paddingHorizontal: 14,
    color: "#2D2D2A",
    fontSize: 22,
    fontWeight: "800",
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  createRecipeButtonWrapper: {
    alignSelf: "flex-start",
  },
  createRecipeButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
  },
  createRecipeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.95,
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    marginTop: 32,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.4,
    borderStyle: "dashed",
    borderColor: "rgba(165, 165, 141, 0.36)",
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    gap: 9,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D2D2A",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: "#6B705C",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 19,
  },
});
