import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../../contexts/AuthContext";
import PhysicalButtonAnimated from "../../../../components/PhysicalButtonAnimated";
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

const shadowCard = Platform.select({
  ios: {
    shadowColor: "#6B705C",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 4,
    shadowColor: "#000",
  },
  default: {},
});

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

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCardShadow}>
      {Platform.OS === "android" && (
        <View pointerEvents="none" style={styles.recipeAndroidShadow} />
      )}
      <View style={styles.recipeCardSurface}>
        {item.coverImageUrl || item.imageUrls[0] ? (
          <Image
            source={{ uri: item.coverImageUrl || item.imageUrls[0] }}
            style={styles.recipeThumb}
          />
        ) : null}
        <View style={styles.recipeHeader}>
          <View style={styles.recipeHeadingBlock}>
            <Text style={styles.recipeEyebrow}>Recette</Text>
            <Text style={styles.recipeTitle}>{item.title}</Text>
          </View>
        </View>

        <View style={styles.recipeMeta}>
          <View style={[styles.metaChip, styles.metaChipAccent]}>
            <Text style={[styles.metaChipText, styles.metaChipTextAccent]}>
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{item.servings} pers.</Text>
          </View>
          {item.duration ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{item.duration}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionButtonWrapper}>
            <PhysicalButtonAnimated
              variant="secondary"
              onPress={() => handleOpenRecipe(item.id, "view")}
              innerStyle={styles.actionButtonInner}
            >
              <Feather name="eye" size={14} color="#6B705C" />
              <Text style={styles.actionButtonSoftText}>Afficher</Text>
            </PhysicalButtonAnimated>
          </View>
          <View style={styles.actionButtonWrapper}>
            <PhysicalButtonAnimated
              variant="primary"
              onPress={() => handleOpenRecipe(item.id, "edit")}
              innerStyle={styles.actionButtonInner}
            >
              <Feather name="edit-2" size={14} color="#FFFFFF" />
              <Text style={styles.actionButtonAccentText}>Modifier</Text>
            </PhysicalButtonAnimated>
          </View>
        </View>

        {activeCustomBook ? (
          <PhysicalButtonAnimated
            variant="secondary"
            onPress={() => handleRemoveRecipeFromBook(item.id)}
            innerStyle={styles.membershipButtonInner}
          >
            <Feather name="minus-circle" size={14} color="#6B705C" />
            <Text style={styles.membershipButtonText}>Retirer du livre</Text>
          </PhysicalButtonAnimated>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.stickyHeader}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.cardPressed]}
          onPress={handleBackToRecipes}
        >
          <Feather name="chevron-left" size={16} color="#6B705C" />
          <Text style={styles.backButtonText}>Tous les livres</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.stickyHeaderTitle}>
          {selectedBook?.name ?? "Livre"}
        </Text>
      </View>
      <FlatList
        data={displayedRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{selectedBook?.name ?? "Livre"}</Text>
            <Text style={styles.subtitle}>
              {selectedBook
                  ? `${displayedRecipes.length} recette${
                    displayedRecipes.length > 1 ? "s" : ""
                  } dans ce livre`
                : "Livre introuvable"}
            </Text>
            {selectedBook ? (
              <View style={styles.createRecipeButtonWrapper}>
                <PhysicalButtonAnimated
                  variant="primary"
                  onPress={handleCreateRecipeInBook}
                  innerStyle={styles.createRecipeButtonInner}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.createRecipeButtonText}>Nouvelle recette</Text>
                </PhysicalButtonAnimated>
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        ListFooterComponent={
          activeCustomBook ? (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Ajouter des recettes au livre</Text>
              {availableRecipes.length ? (
                availableRecipes.map((recipe) => (
                  <View key={recipe.id} style={styles.availableRow}>
                    <Text style={styles.availableName}>{recipe.title}</Text>
                    <PhysicalButtonAnimated
                      variant="secondary"
                      onPress={() => handleAddRecipeToBook(recipe.id)}
                      borderRadius={14}
                      innerStyle={styles.availableAddButtonInner}
                    >
                      <Feather name="plus" size={14} color="#6B705C" />
                      <Text style={styles.availableAddText}>Ajouter</Text>
                    </PhysicalButtonAnimated>
                  </View>
                ))
              ) : (
                <Text style={styles.availableEmpty}>
                  Toutes les recettes sont déjà dans ce livre.
                </Text>
              )}
            </View>
          ) : null
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
  stickyHeaderTitle: {
    color: "#2D2D2A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
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
  createRecipeButtonWrapper: {
    alignSelf: "flex-start",
    marginTop: 6,
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
  recipeCardShadow: {
    borderRadius: 24,
    position: "relative",
    ...shadowCard,
  },
  recipeAndroidShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: -1,
    right: -1,
    bottom: -2,
    borderRadius: 24,
    backgroundColor: "#000000",
    opacity: 0.11,
  },
  recipeCardSurface: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    gap: 12,
  },
  recipeThumb: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 22,
    backgroundColor: "#F5EFE4",
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  recipeHeadingBlock: {
    flex: 1,
    gap: 3,
  },
  recipeEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#A5A58D",
  },
  recipeTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#2D2D2A",
    letterSpacing: -0.6,
    lineHeight: 25,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  metaChip: {
    backgroundColor: "#F5EFE4",
    borderWidth: 1,
    borderColor: "#E4D9C8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipAccent: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderColor: "rgba(188, 108, 37, 0.2)",
  },
  metaChipText: {
    color: "#6B705C",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaChipTextAccent: {
    color: "#BC6C25",
  },
  actionsRow: {
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: "rgba(228, 217, 200, 0.7)",
    flexDirection: "row",
    gap: 8,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButtonInner: {
    flexDirection: "row",
    gap: 6,
  },
  actionButtonSoftText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonAccentText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  membershipButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  membershipButtonText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "700",
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.95,
  },
  footerSection: {
    marginTop: 10,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    gap: 8,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A5A58D",
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 3,
  },
  availableName: {
    flex: 1,
    color: "#2D2D2A",
    fontSize: 14,
    fontWeight: "600",
  },
  availableAddButtonInner: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  availableAddText: {
    color: "#6B705C",
    fontSize: 12,
    fontWeight: "700",
  },
  availableEmpty: {
    fontSize: 13,
    color: "#6B705C",
    lineHeight: 18,
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
