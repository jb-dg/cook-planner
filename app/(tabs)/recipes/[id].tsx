import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PhysicalButton from "../../../components/PhysicalButton";
import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";
import { useAuth } from "../../../contexts/AuthContext";
import {
  mapRecipe,
  RecipeFormState,
  RecipeInput,
  recipeToFormState,
} from "../../../features/recipes/types";
import { fetchHouseholdScope } from "../../../lib/households";
import { supabase } from "../../../lib/supabase";
import { colors, spacing } from "../../../theme/design";
import RecipeForm from "./RecipeForm";

type ScreenMode = "view" | "edit";
type RecipeRow = Parameters<typeof mapRecipe>[0] & {
  user_id?: string | null;
  household_id?: string | null;
};

const getScreenMode = (mode?: string): ScreenMode =>
  mode === "edit" ? "edit" : "view";

const RECIPE_SELECT_WITH_IMAGES =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url,user_id,household_id";
const RECIPE_SELECT_BASIC =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,user_id,household_id";

export default function RecipeScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [initialValues, setInitialValues] = useState<RecipeFormState | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>(getScreenMode(mode));

  useEffect(() => {
    setScreenMode(getScreenMode(mode));
  }, [mode]);

  const displayIngredients = useMemo(() => {
    if (!initialValues) return [];
    return initialValues.ingredients.filter(
      (item) => item.name.trim() || item.quantity.trim(),
    );
  }, [initialValues]);

  const displaySteps = useMemo(() => {
    if (!initialValues) return [];
    return initialValues.steps.filter((item) => item.text.trim());
  }, [initialValues]);

  const loadRecipe = useCallback(async () => {
    if (!session || !id) return;

    setError(null);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const primary = await supabase
        .from("recipes")
        .select(RECIPE_SELECT_WITH_IMAGES)
        .eq("id", id)
        .maybeSingle();
      let data = primary.data as RecipeRow | null;
      let fetchError = primary.error;

      if (fetchError?.code === "42703") {
        const fallback = await supabase
          .from("recipes")
          .select(RECIPE_SELECT_BASIC)
          .eq("id", id)
          .maybeSingle();

        data = fallback.data as RecipeRow | null;
        fetchError = fallback.error;
      }

      if (fetchError) {
        throw fetchError;
      }

      const belongsToOwner = data?.user_id === session.user.id;
      const belongsToHousehold =
        !!scope.householdId && data?.household_id === scope.householdId;

      if (!data || (!belongsToOwner && !belongsToHousehold)) {
        setError("Recette introuvable.");
        return;
      }

      setInitialValues(recipeToFormState(mapRecipe(data)));
    } catch (err) {
      console.error("load recipe", err);
      setError("Impossible de charger cette recette.");
    } finally {
      setLoading(false);
    }
  }, [session, id]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleUpdate = async (input: RecipeInput) => {
    if (!session || !id) return;
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const column = scope.householdId ? "household_id" : "user_id";
      const value = scope.householdId ?? session.user.id;
      const basePayload = {
        title: input.title,
        duration: input.duration,
        description: input.description,
        servings: input.servings,
        difficulty: input.difficulty,
        ingredients: input.ingredients,
        steps: input.steps,
        source_url: input.source_url,
      };

      let { error: updateError } = await supabase
        .from("recipes")
        .update({
          ...basePayload,
          image_urls: input.image_urls,
          cover_image_url: input.cover_image_url,
        })
        .eq("id", id)
        .eq(column, value);

      if (updateError?.code === "42703") {
        const fallback = await supabase
          .from("recipes")
          .update(basePayload)
          .eq("id", id)
          .eq(column, value);

        updateError = fallback.error;
      }

      if (updateError) {
        throw updateError;
      }

      router.back();
    } catch (err) {
      console.error("update recipe", err);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour la recette. Réessaie plus tard.",
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer la recette",
      "Cette action est définitive. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!session || !id) return;
    setDeleting(true);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const column = scope.householdId ? "household_id" : "user_id";
      const value = scope.householdId ?? session.user.id;
      const { error: deleteError } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq(column, value);

      if (deleteError) {
        throw deleteError;
      }

      router.back();
    } catch (err) {
      console.error("delete recipe", err);
      Alert.alert(
        "Erreur",
        "Impossible de supprimer la recette. Réessaie plus tard.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentSecondary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : initialValues ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {screenMode === "view"
              ? "Afficher la recette"
              : "Modifier la recette"}
          </Text>

          <View style={styles.modeSwitch}>
            <Pressable
              style={[
                styles.modeButton,
                screenMode === "view" && styles.modeButtonActive,
              ]}
              onPress={() => setScreenMode("view")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  screenMode === "view" && styles.modeButtonTextActive,
                ]}
              >
                Afficher
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                screenMode === "edit" && styles.modeButtonActive,
              ]}
              onPress={() => setScreenMode("edit")}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  screenMode === "edit" && styles.modeButtonTextActive,
                ]}
              >
                Modifier
              </Text>
            </Pressable>
          </View>

          {screenMode === "view" ? (
            <View style={styles.recipeCard}>
              {initialValues.coverImageUrl || initialValues.imageUrls[0] ? (
                <Image
                  source={{
                    uri: initialValues.coverImageUrl || initialValues.imageUrls[0],
                  }}
                  style={styles.recipeCover}
                />
              ) : null}
              <Text style={styles.recipeTitle}>{initialValues.title}</Text>

              <View style={styles.recipeMetaRow}>
                <View style={styles.recipeMetaChip}>
                  <Text style={styles.recipeMetaChipText}>
                    {initialValues.difficulty}
                  </Text>
                </View>
                <View style={styles.recipeMetaChip}>
                  <Text style={styles.recipeMetaChipText}>
                    {initialValues.servings} pers.
                  </Text>
                </View>
                {initialValues.duration ? (
                  <View style={styles.recipeMetaChip}>
                    <Text style={styles.recipeMetaChipText}>
                      {initialValues.duration}
                    </Text>
                  </View>
                ) : null}
              </View>

              {initialValues.imageUrls.length > 1 ? (
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionLabel}>Photos</Text>
                  <View style={styles.photoStrip}>
                    {initialValues.imageUrls.map((url) => (
                      <Image
                        key={url}
                        source={{ uri: url }}
                        style={styles.photoThumb}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionLabel}>Note</Text>
                <Text style={styles.recipeDescription}>
                  {initialValues.description || "Aucune note."}
                </Text>
              </View>

              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionLabel}>Ingrédients</Text>
                {displayIngredients.length ? (
                  displayIngredients.map((item) => (
                    <View style={styles.ingredientRow} key={item.id}>
                      <Text style={styles.ingredientName}>{item.name}</Text>
                      <Text style={styles.ingredientValue}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.recipeDescription}>
                    Aucun ingrédient renseigné.
                  </Text>
                )}
              </View>

              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionLabel}>Étapes</Text>
                {displaySteps.length ? (
                  displaySteps.map((item, index) => (
                    <View style={styles.stepRow} key={item.id}>
                      <View style={styles.stepIndex}>
                        <Text style={styles.stepIndexText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{item.text}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.recipeDescription}>
                    Aucune étape renseignée.
                  </Text>
                )}
              </View>

              {initialValues.sourceUrl ? (
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionLabel}>Source</Text>
                  <Text style={styles.sourceText}>{initialValues.sourceUrl}</Text>
                </View>
              ) : null}

              <PhysicalButton
                variant="secondary"
                onPress={() => setScreenMode("edit")}
              >
                <Text style={styles.editFromViewButtonText}>
                  Modifier la recette
                </Text>
              </PhysicalButton>
            </View>
          ) : (
            <>
              <RecipeForm
                initialValues={initialValues}
                submitLabel="Mettre à jour"
                uploadPathPrefix={`recipes/${session?.user.id ?? "unknown"}`}
                onSubmit={handleUpdate}
              />
              <View style={styles.deleteWrapper}>
                <Text style={styles.deleteLabel}>Danger</Text>
                <PhysicalButtonAnimated
                  variant="danger"
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleting ? "Suppression…" : "Supprimer cette recette"}
                  </Text>
                </PhysicalButtonAnimated>
              </View>
            </>
          )}

        </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: spacing.screen,
    gap: 16,
    paddingBottom: 160,
  },
  heading: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(228, 217, 200, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  modeButton: {
    flex: 1,
    borderRadius: 999,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  modeButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
  },
  recipeCard: {
    padding: spacing.card,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    gap: 14,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  recipeCover: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
  },
  photoStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoThumb: {
    width: 86,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  recipeMetaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  recipeMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.2)",
    backgroundColor: "rgba(188, 108, 37, 0.09)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  recipeMetaChipText: {
    color: colors.accent,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  recipeSection: {
    gap: 8,
  },
  recipeSectionLabel: {
    color: colors.accentTertiary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  recipeDescription: {
    color: colors.text,
    lineHeight: 20,
    fontSize: 14,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 2,
  },
  ingredientName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  ingredientValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    color: colors.text,
    lineHeight: 20,
    fontSize: 14,
  },
  sourceText: {
    color: colors.accent,
    lineHeight: 20,
    fontSize: 13,
    fontWeight: "700",
  },
  editFromViewButtonText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  deleteWrapper: {
    marginTop: 24,
    gap: 10,
    padding: spacing.card,
    borderRadius: 20,
    backgroundColor: "rgba(199, 82, 82, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(199, 82, 82, 0.15)",
  },
  deleteLabel: {
    color: colors.danger,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
