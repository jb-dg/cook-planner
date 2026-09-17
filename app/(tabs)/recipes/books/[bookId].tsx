import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../contexts/AuthContext";
import PhysicalButtonAnimated from "../../../../components/PhysicalButtonAnimated";
import PhysicalIconButton from "../../../../components/PhysicalIconButton";
import AddRecipesToBookModal from "../../../../features/recipes/components/AddRecipesToBookModal";
import AddRecipeToPlannerModal from "../../../../features/recipes/components/AddRecipeToPlannerModal";
import MoveRecipeToBookModal from "../../../../features/recipes/components/MoveRecipeToBookModal";
import RecipeCard from "../../../../features/recipes/components/RecipeCard";
import RecipeViewModal from "../../../../features/recipes/components/RecipeViewModal";
import {
  buildRecipeBooks,
  CustomBook,
  deleteCustomBook,
  fetchCustomBooks,
  moveRecipeToBook,
  renameCustomBook,
  RecipeBook,
  SYSTEM_BOOK_ID,
  updateCustomBookEmoji,
  updateCustomBookSharing,
} from "../../../../features/recipes/books";
import { mapRecipe, Recipe } from "../../../../features/recipes/types";
import { fetchHouseholdScope, HouseholdScope } from "../../../../lib/households";
import { supabase } from "../../../../lib/supabase";
import { colors, spacing } from "../../../../theme/design";

type RecipeRow = Parameters<typeof mapRecipe>[0];

const RECIPE_SELECT_WITH_IMAGES =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url,book_id";
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
  const [moveRecipeId, setMoveRecipeId] = useState<string | null>(null);
  const [plannerRecipeId, setPlannerRecipeId] = useState<string | null>(null);

  // null = not editing. Tied to the viewed book, so navigating to a
  // different book discards an in-progress edit instead of leaving stale UI.
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingEmoji, setEditingEmoji] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  useEffect(() => {
    setEditingName(null);
    setEditingEmoji("");
    setRenameError(null);
  }, [currentBookId]);

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
    if (!session) {
      setCustomBooks([]);
      setBooksLoading(false);
      return;
    }

    setBooksLoading(true);
    fetchCustomBooks()
      .then((books) => {
        if (cancelled) return;
        setCustomBooks(books);
      })
      .catch((fetchErr) => {
        console.error("load recipe books", fetchErr);
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
  }, [session]);

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
    if (!activeCustomBook || !selectedBook) return [];
    const ids = new Set(selectedBook.recipeIds);
    return recipes.filter((recipe) => !ids.has(recipe.id));
  }, [activeCustomBook, selectedBook, recipes]);

  const recipeBeingMoved = useMemo(
    () => recipes.find((recipe) => recipe.id === moveRecipeId) ?? null,
    [recipes, moveRecipeId],
  );
  const moveTargetBooks = useMemo(
    () => books.filter((book) => !book.isSystem && book.id !== selectedBook?.id),
    [books, selectedBook],
  );
  const recipeBeingPlanned = useMemo(
    () => recipes.find((recipe) => recipe.id === plannerRecipeId) ?? null,
    [recipes, plannerRecipeId],
  );

  const hasHousehold = !!scope?.householdId;

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

  const handleAddRecipeToBook = async (recipeId: string) => {
    if (!activeCustomBook) return;
    try {
      await moveRecipeToBook(recipeId, activeCustomBook.id);
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === recipeId ? { ...recipe, bookId: activeCustomBook.id } : recipe,
        ),
      );
    } catch (err) {
      console.error("add recipe to book", err);
    }
  };

  const handleRemoveRecipeFromBook = async (recipeId: string) => {
    if (!activeCustomBook) return;
    try {
      await moveRecipeToBook(recipeId, SYSTEM_BOOK_ID);
      setRecipes((prev) =>
        prev.map((recipe) => (recipe.id === recipeId ? { ...recipe, bookId: null } : recipe)),
      );
    } catch (err) {
      console.error("remove recipe from book", err);
    }
  };

  const handleMoveRecipeToAnotherBook = async (targetBookId: string) => {
    if (!moveRecipeId) return;
    try {
      await moveRecipeToBook(moveRecipeId, targetBookId);
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === moveRecipeId ? { ...recipe, bookId: targetBookId } : recipe,
        ),
      );
    } catch (err) {
      console.error("move recipe to book", err);
    } finally {
      setMoveRecipeId(null);
    }
  };

  const startRename = () => {
    if (!selectedBook) return;
    setEditingName(selectedBook.name);
    setEditingEmoji(activeCustomBook?.emoji ?? "");
    setRenameError(null);
  };

  const cancelRename = () => {
    setEditingName(null);
    setEditingEmoji("");
    setRenameError(null);
  };

  const confirmRename = async () => {
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

    const trimmedEmoji = editingEmoji.trim() || null;

    try {
      await renameCustomBook(selectedBook.id, trimmed);
      if (trimmedEmoji !== (activeCustomBook?.emoji ?? null)) {
        await updateCustomBookEmoji(selectedBook.id, trimmedEmoji);
      }
      setCustomBooks((prev) =>
        prev.map((book) =>
          book.id === selectedBook.id
            ? { ...book, name: trimmed, emoji: trimmedEmoji }
            : book,
        ),
      );
      setEditingName(null);
      setEditingEmoji("");
      setRenameError(null);
    } catch (err) {
      console.error("rename recipe book", err);
      setRenameError("Impossible de renommer le livre. Réessaie plus tard.");
    }
  };

  const handleToggleSharing = async (shared: boolean) => {
    if (!activeCustomBook) return;
    const targetHouseholdId = shared ? scope?.householdId ?? null : null;
    if (targetHouseholdId === activeCustomBook.householdId) return;

    try {
      await updateCustomBookSharing(activeCustomBook.id, targetHouseholdId);
      setCustomBooks((prev) =>
        prev.map((book) =>
          book.id === activeCustomBook.id
            ? { ...book, householdId: targetHouseholdId }
            : book,
        ),
      );
    } catch (err) {
      console.error("update book sharing", err);
      Alert.alert(
        "Erreur",
        "Impossible de modifier le partage de ce livre. Réessaie plus tard.",
      );
    }
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
          onPress: async () => {
            try {
              await deleteCustomBook(selectedBook.id);
              setCustomBooks((prev) =>
                prev.filter((book) => book.id !== selectedBook.id),
              );
              handleBackToRecipes();
            } catch (err) {
              console.error("delete recipe book", err);
            }
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
      onMove={activeCustomBook ? () => setMoveRecipeId(item.id) : undefined}
      onAddToPlanner={() => setPlannerRecipeId(item.id)}
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
              <View style={styles.renameRow}>
                <TextInput
                  value={editingEmoji}
                  onChangeText={setEditingEmoji}
                  placeholder="🍰"
                  placeholderTextColor="#A5A58D"
                  style={styles.renameEmojiInput}
                  maxLength={2}
                />
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  autoFocus
                  style={[styles.renameInput, styles.renameNameInput]}
                  onSubmitEditing={confirmRename}
                  returnKeyType="done"
                />
              </View>
            ) : (
              <Text style={styles.heading}>
                {selectedBook?.emoji ? `${selectedBook.emoji} ` : ""}
                {selectedBook?.name ?? "Livre"}
              </Text>
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
            {selectedBook && !selectedBook.isSystem && editingName === null ? (
              <View style={styles.sharingRow}>
                <Pressable
                  style={[
                    styles.sharingChip,
                    !selectedBook.isShared && styles.sharingChipActive,
                  ]}
                  onPress={() => handleToggleSharing(false)}
                >
                  <Feather
                    name="lock"
                    size={12}
                    color={!selectedBook.isShared ? "#FFFFFF" : colors.muted}
                  />
                  <Text
                    style={[
                      styles.sharingChipText,
                      !selectedBook.isShared && styles.sharingChipTextActive,
                    ]}
                  >
                    Privé
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.sharingChip,
                    selectedBook.isShared && styles.sharingChipActive,
                  ]}
                  onPress={() => handleToggleSharing(true)}
                  disabled={!hasHousehold}
                >
                  <Feather
                    name="users"
                    size={12}
                    color={selectedBook.isShared ? "#FFFFFF" : colors.muted}
                  />
                  <Text
                    style={[
                      styles.sharingChipText,
                      selectedBook.isShared && styles.sharingChipTextActive,
                    ]}
                  >
                    Partagé avec le foyer
                  </Text>
                </Pressable>
              </View>
            ) : null}
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
      <MoveRecipeToBookModal
        visible={!!moveRecipeId}
        recipeTitle={recipeBeingMoved?.title ?? ""}
        currentBookName={selectedBook?.name ?? "Livre"}
        targetBooks={moveTargetBooks}
        onSelectBook={handleMoveRecipeToAnotherBook}
        onClose={() => setMoveRecipeId(null)}
      />
      <AddRecipeToPlannerModal
        visible={!!plannerRecipeId}
        recipe={recipeBeingPlanned}
        session={session}
        onClose={() => setPlannerRecipeId(null)}
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
    paddingBottom: spacing.screen * 2,
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
  renameRow: {
    flexDirection: "row",
    gap: 8,
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
  renameNameInput: {
    flex: 1,
  },
  renameEmojiInput: {
    width: 56,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#FCFAF7",
    textAlign: "center",
    fontSize: 22,
  },
  sharingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  sharingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    borderRadius: 999,
    backgroundColor: "#FCFAF7",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sharingChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sharingChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  sharingChipTextActive: {
    color: "#FFFFFF",
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
