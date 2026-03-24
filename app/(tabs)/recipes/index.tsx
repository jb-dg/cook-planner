import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../contexts/AuthContext";
import {
  buildBooksStorageKey,
  buildRecipeBooks,
  CustomBook,
  parseStoredBooks,
  RecipeBook,
} from "../../../features/recipes/books";
import { mapRecipe, Recipe } from "../../../features/recipes/types";
import { fetchHouseholdScope, HouseholdScope } from "../../../lib/households";
import { supabase } from "../../../lib/supabase";
import { colors, spacing } from "../../../theme/design";

const shadowHero = Platform.select({
  ios: {
    shadowColor: "#6B705C",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  android: {
    elevation: 3,
    shadowColor: "#000",
  },
  default: {},
});

const shadowCard = Platform.select({
  ios: {
    shadowColor: "#6B705C",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 3,
    shadowColor: "#000",
  },
  default: {},
});

export default function RecipeBooksScreen() {
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
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select("id,title,duration,difficulty,servings,description,ingredients")
        .eq(nextScope.filterColumn, nextScope.filterValue)
        .order("created_at", { ascending: false });

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

  const booksCountLabel = useMemo(() => {
    const count = books.length;
    if (count === 1) return "1 livre";
    return `${count} livres`;
  }, [books.length]);

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchRecipes();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchRecipes]);

  const handleCreateBook = () => {
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
  };

  const handleOpenBook = (book: RecipeBook) => {
    router.push({
      pathname: "/(tabs)/recipes/books/[bookId]",
      params: { bookId: book.id },
    });
  };

  const renderBook = ({ item }: { item: RecipeBook }) => (
    <Pressable
      onPress={() => handleOpenBook(item)}
      style={({ pressed }) => [styles.bookCardShadow, pressed && styles.cardPressed]}
    >
      {Platform.OS === "android" && (
        <View pointerEvents="none" style={styles.bookAndroidShadow} />
      )}
      <View style={styles.bookCardSurface}>
        <View style={styles.bookCardHeader}>
          <View style={styles.bookTitleBlock}>
            <Text style={styles.bookEyebrow}>{item.isSystem ? "Système" : "Livre"}</Text>
            <Text style={styles.bookTitle}>{item.name}</Text>
          </View>
          <View style={styles.bookArrow}>
            <Feather name="chevron-right" size={18} color="#BC6C25" />
          </View>
        </View>
        <View style={styles.bookFooterRow}>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>
              {item.recipeIds.length} recette{item.recipeIds.length > 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.bookFooterText}>
            Appuie pour voir les recettes de ce livre
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={loading || booksLoading ? [] : books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heroShadow}>
              {Platform.OS === "android" && (
                <View pointerEvents="none" style={styles.heroAndroidShadow} />
              )}
              <View style={styles.heroSurface}>
                <View style={styles.headerRow}>
                  <View style={styles.headingBlock}>
                    <Text style={styles.headingKicker}>Carnet</Text>
                    <Text style={styles.heading}>Livres de recettes</Text>
                  </View>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => router.push("/(tabs)/recipes/create")}
                  >
                    <Feather name="plus" size={20} color="#BC6C25" />
                  </Pressable>
                </View>
                <Text style={styles.subtitle}>
                  Choisis un livre pour ouvrir sa liste de recettes. Le livre
                  “Recettes du foyer” regroupe toutes les recettes du foyer.
                </Text>
                <View style={styles.headerMetaRow}>
                  <View style={styles.headerChip}>
                    <Text style={styles.headerChipText}>{booksCountLabel}</Text>
                  </View>
                  <Text style={styles.subheading}>
                    {recipes.length} recette{recipes.length > 1 ? "s" : ""} au total
                  </Text>
                </View>
                <View style={styles.bookCreatorRow}>
                  <TextInput
                    value={bookName}
                    onChangeText={(value) => {
                      setBookName(value);
                      if (bookError) setBookError(null);
                    }}
                    placeholder="Nom du nouveau livre"
                    placeholderTextColor="#A5A58D"
                    style={styles.bookInput}
                  />
                  <Pressable style={styles.createBookButton} onPress={handleCreateBook}>
                    <Feather name="book-open" size={14} color="#FFFFFF" />
                    <Text style={styles.createBookButtonText}>Créer</Text>
                  </Pressable>
                </View>
                {bookError ? <Text style={styles.bookErrorText}>{bookError}</Text> : null}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading || booksLoading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.accentSecondary}
              size="large"
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
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
  header: {
    marginBottom: 2,
  },
  heroShadow: {
    borderRadius: 34,
    position: "relative",
    ...shadowHero,
  },
  heroAndroidShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: -1,
    right: -1,
    bottom: -2,
    borderRadius: 34,
    backgroundColor: "#000000",
    opacity: 0.12,
  },
  heroSurface: {
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headingBlock: {
    flex: 1,
    gap: 4,
  },
  headingKicker: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#A5A58D",
  },
  heading: {
    fontSize: 29,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  subtitle: {
    color: "#6B705C",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#F5EFE4",
  },
  headerChipText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#6B705C",
  },
  subheading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A5A58D",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#F5EFE4",
    borderWidth: 1,
    borderColor: "#E4D9C8",
    alignItems: "center",
    justifyContent: "center",
  },
  bookCreatorRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  bookInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#FCFAF7",
    paddingHorizontal: 14,
    color: "#2D2D2A",
    fontSize: 14,
    fontWeight: "500",
  },
  createBookButton: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#BC6C25",
    borderWidth: 1,
    borderColor: "#BC6C25",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 6,
  },
  createBookButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  bookErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  bookCardShadow: {
    borderRadius: 26,
    position: "relative",
    ...shadowCard,
  },
  bookAndroidShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: -1,
    right: -1,
    bottom: -2,
    borderRadius: 26,
    backgroundColor: "#000000",
    opacity: 0.11,
  },
  bookCardSurface: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  bookCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  bookTitleBlock: {
    flex: 1,
    gap: 3,
  },
  bookEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A5A58D",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  bookTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#2D2D2A",
    letterSpacing: -0.5,
    lineHeight: 25,
  },
  bookArrow: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.2)",
    backgroundColor: "rgba(188, 108, 37, 0.09)",
  },
  bookFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(228, 217, 200, 0.7)",
    paddingTop: 10,
  },
  countChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#F5EFE4",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bookFooterText: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "600",
    color: "#A5A58D",
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.95,
  },
  loader: {
    marginTop: 32,
  },
});
