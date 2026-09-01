import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";
import { useAuth } from "../../../contexts/AuthContext";
import {
  createEmptyAddRecipeDraft,
  getExtractionFromSource,
  getMissingFields,
  RecipeSearchResult,
  searchRecipeCatalog,
  toRecipeInput,
} from "../../../features/recipes/addFlow";
import RecipeViewModal from "../../../features/recipes/components/RecipeViewModal";
import type { Recipe } from "../../../features/recipes/types";
import { fetchHouseholdScope } from "../../../lib/households";
import { supabase } from "../../../lib/supabase";
import { colors, radii, spacing } from "../../../theme/design";

const MISSING_LABELS = {
  title: "titre",
  ingredients: "ingrédients",
  steps: "étapes",
};

export default function ExploreRecipesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  // result.id -> saved recipe's own id (or null if the insert didn't return
  // one). Lets a saved card's button turn into "open" instead of just
  // going inert, without needing a blocking alert to offer that.
  const [savedRecipes, setSavedRecipes] = useState<Map<string, string | null>>(
    () => new Map()
  );
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/recipes");
  };

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Saisis une recherche.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const nextResults = await searchRecipeCatalog(trimmedQuery);
      setResults(nextResults);
      if (!nextResults.length) {
        setError("Aucune recette trouvée.");
      }
    } catch (searchError) {
      console.error("explore recipes search", searchError);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Recherche impossible. Vérifie la fonction Supabase recipe-search."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (result: RecipeSearchResult) => {
    if (!session || savingRecipeId) return;

    setSavingRecipeId(result.id);
    try {
      const extracted = await getExtractionFromSource("search", result.id);
      const draft = {
        ...createEmptyAddRecipeDraft(),
        sourceType: "search" as const,
        sourceValue: result.id,
        // The search result's own title came straight from Marmiton's
        // listing JSON-LD and is always reliable, even on the rare page
        // where the detail-page extraction below fails to find one.
        title: extracted.title || result.title,
        duration: extracted.duration,
        servings: extracted.servings,
        difficulty: extracted.difficulty,
        ingredients: extracted.ingredients,
        description: extracted.description,
        steps: extracted.steps,
        sourceUrl: extracted.sourceUrl,
        imageUrls: extracted.imageUrls?.length
          ? extracted.imageUrls
          : result.imageUrl
            ? [result.imageUrl]
            : [],
        coverImageUrl: extracted.coverImageUrl || result.imageUrl || "",
      };

      // Ingredients/steps the scraper couldn't find no longer block the
      // save — the recipe is inserted with whatever was extracted, then
      // opened straight in edit mode so the gap can be filled in there
      // instead of losing the whole import.
      const missingFields = getMissingFields(draft);

      const scope = await fetchHouseholdScope(session.user.id);
      const input = toRecipeInput(draft);
      const basePayload = {
        user_id: session.user.id,
        household_id: scope.householdId,
        title: input.title,
        duration: input.duration,
        description: input.description,
        servings: input.servings,
        difficulty: input.difficulty,
        ingredients: input.ingredients,
        steps: input.steps,
        source_url: input.source_url,
      };

      let { data, error: insertError } = await supabase
        .from("recipes")
        .insert({
          ...basePayload,
          image_urls: input.image_urls,
          cover_image_url: input.cover_image_url,
        })
        .select("id")
        .single();

      if (insertError?.code === "42703") {
        const fallback = await supabase
          .from("recipes")
          .insert(basePayload)
          .select("id")
          .single();

        data = fallback.data;
        insertError = fallback.error;
      }

      if (insertError) throw insertError;

      const recipeId = data?.id ? String(data.id) : null;
      // No success alert — the card's own button switching to "Ouvrir"
      // already confirms it worked, without blocking the flow of adding
      // several recipes in a row from this list.
      setSavedRecipes((prev) => new Map(prev).set(result.id, recipeId));

      if (missingFields.length && recipeId) {
        Alert.alert(
          "Import partiel",
          `Cette recette manque de ${missingFields
            .map((field) => MISSING_LABELS[field])
            .join(", ")}. Complète-la maintenant.`,
          [
            {
              text: "Plus tard",
              style: "cancel",
            },
            {
              text: "Compléter",
              onPress: () =>
                router.push({
                  pathname: "/(tabs)/recipes/[id]",
                  params: { id: recipeId, mode: "edit" },
                }),
            },
          ]
        );
      }
    } catch (saveError) {
      console.error("save explored recipe", saveError);
      Alert.alert("Erreur", "Impossible d'ajouter cette recette pour le moment.");
    } finally {
      setSavingRecipeId(null);
    }
  };

  // Runs the same page extraction as saving does, but only to show it in
  // RecipeViewModal — nothing is written to the database until the user
  // actually taps "Ajouter" on the card underneath.
  const handlePreviewRecipe = async (result: RecipeSearchResult) => {
    if (previewingId) return;

    setPreviewingId(result.id);
    try {
      const extracted = await getExtractionFromSource("search", result.id);
      setPreviewRecipe({
        id: result.id,
        title: extracted.title || result.title,
        duration: extracted.duration,
        difficulty: extracted.difficulty,
        servings: Number(extracted.servings) || 1,
        description: extracted.description,
        ingredients: extracted.ingredients,
        steps: extracted.steps,
        sourceUrl: extracted.sourceUrl,
        imageUrls: extracted.imageUrls?.length
          ? extracted.imageUrls
          : result.imageUrl
            ? [result.imageUrl]
            : [],
        coverImageUrl: extracted.coverImageUrl || result.imageUrl || "",
      });
    } catch (previewError) {
      console.error("preview explored recipe", previewError);
      Alert.alert("Erreur", "Impossible de charger l'aperçu de cette recette.");
    } finally {
      setPreviewingId(null);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Connecte-toi pour explorer les recettes.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={handleBack}
            >
              <Feather name="chevron-left" size={16} color="#6B705C" />
              <Text style={styles.backButtonText}>Retour</Text>
            </Pressable>
            <Text style={styles.kicker}>Marmiton</Text>
            <Text style={styles.heading}>Explorer</Text>
          </View>

          <View style={styles.searchPanel}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Pâtes, curry, salade, dessert..."
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={(value) => {
                  setQuery(value);
                  if (error) setError(null);
                }}
                returnKeyType="search"
                onSubmitEditing={() => {
                  void handleSearch();
                }}
              />
              <PhysicalButtonAnimated
                variant="primary"
                onPress={() => {
                  void handleSearch();
                }}
                disabled={loading}
                innerStyle={styles.searchButtonInner}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Feather name="search" size={17} color="#FFFFFF" />
                )}
              </PhysicalButtonAnimated>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.emptyTitle}>Recherche en cours…</Text>
            </View>
          ) : !results.length ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={22} color={colors.accentTertiary} />
              <Text style={styles.emptyTitle}>Cherche une idée de repas</Text>
            </View>
          ) : null}

          <View style={styles.results}>
            {results.map((result) => {
              const isSaving = savingRecipeId === result.id;
              const isSaved = savedRecipes.has(result.id);
              const savedRecipeId = savedRecipes.get(result.id) ?? null;
              const isPreviewing = previewingId === result.id;

              return (
                <Pressable
                  key={result.id}
                  style={styles.resultCard}
                  onPress={() => {
                    void handlePreviewRecipe(result);
                  }}
                >
                  <View style={styles.resultImageWrap}>
                    {result.imageUrl ? (
                      <Image source={{ uri: result.imageUrl }} style={styles.resultImage} />
                    ) : (
                      <View style={styles.resultImagePlaceholder}>
                        <Feather name="image" size={24} color={colors.accentTertiary} />
                      </View>
                    )}
                    {isPreviewing ? (
                      <View style={styles.resultImageLoading}>
                        <ActivityIndicator color={colors.accent} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.resultBody}>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    <View style={styles.metaRow}>
                      {result.readyInMinutes ? (
                        <Text style={styles.metaText}>{result.readyInMinutes} min</Text>
                      ) : null}
                      {result.servings ? (
                        <Text style={styles.metaText}>{result.servings} pers.</Text>
                      ) : null}
                    </View>
                    <View style={styles.cardActions}>
                      <PhysicalButtonAnimated
                        variant={isSaved ? "secondary" : "primary"}
                        onPress={() => {
                          if (isSaved) {
                            if (savedRecipeId) {
                              router.push({
                                pathname: "/(tabs)/recipes/[id]",
                                params: { id: savedRecipeId, mode: "view" },
                              });
                            }
                            return;
                          }
                          void handleSaveRecipe(result);
                        }}
                        disabled={isSaving || (isSaved && !savedRecipeId)}
                        innerStyle={styles.addButtonInner}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather
                              name={isSaved ? "arrow-right" : "plus"}
                              size={14}
                              color={isSaved ? colors.muted : "#FFFFFF"}
                            />
                            <Text
                              style={
                                isSaved
                                  ? styles.addButtonTextSaved
                                  : styles.addButtonText
                              }
                            >
                              {isSaved ? "Ouvrir" : "Ajouter"}
                            </Text>
                          </>
                        )}
                      </PhysicalButtonAnimated>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <RecipeViewModal
        visible={!!previewRecipe}
        recipe={previewRecipe}
        onClose={() => setPreviewRecipe(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    padding: spacing.screen,
    paddingBottom: 150,
    gap: 16,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.screen,
  },
  headerBlock: {
    gap: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    marginLeft: -4,
  },
  backButtonText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.95,
  },
  kicker: {
    color: colors.accentTertiary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },
  searchPanel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  searchButtonInner: {
    width: 54,
    paddingHorizontal: 0,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyState: {
    minHeight: 170,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.68)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  results: {
    gap: 12,
  },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  resultImageWrap: {
    position: "relative",
  },
  resultImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
  },
  resultImagePlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  resultImageLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultBody: {
    padding: 14,
    gap: 10,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  cardActions: {
    flexDirection: "row",
  },
  addButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  addButtonTextSaved: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
  },
});
