import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { colors, layout, spacing, radii } from "../../../theme/design";
import RecipeForm from "./RecipeForm";
import {
  mapRecipe,
  recipeToFormState,
  RecipeFormState,
  RecipeInput,
} from "../../../features/recipes/types";

type ScreenMode = "view" | "edit";

const getScreenMode = (mode?: string): ScreenMode =>
  mode === "edit" ? "edit" : "view";

export default function RecipeScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const isWeb = Platform.OS === "web";
  const [initialValues, setInitialValues] = useState<RecipeFormState | null>(
    null
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
      (item) => item.name.trim() || item.quantity.trim()
    );
  }, [initialValues]);

  const loadRecipe = useCallback(async () => {
    if (!session || !id) return;

    setError(null);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select(
          "id,title,duration,difficulty,servings,description,ingredients,user_id,household_id"
        )
        .eq("id", id)
        .maybeSingle();

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
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title: input.title,
          duration: input.duration,
          description: input.description,
          servings: input.servings,
          difficulty: input.difficulty,
          ingredients: input.ingredients,
        })
        .eq("id", id)
        .eq(column, value);

      if (updateError) {
        throw updateError;
      }

      router.back();
    } catch (err) {
      console.error("update recipe", err);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour la recette. Réessaie plus tard."
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
      ]
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
        "Impossible de supprimer la recette. Réessaie plus tard."
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
        <ScrollView
          contentContainerStyle={[styles.container, isWeb && styles.containerWeb]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>
            {screenMode === "view" ? "Afficher la recette" : "Modifier la recette"}
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

              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionLabel}>Description</Text>
                <Text style={styles.recipeDescription}>
                  {initialValues.description || "Aucune description."}
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

              <Pressable
                style={styles.editFromViewButton}
                onPress={() => setScreenMode("edit")}
              >
                <Text style={styles.editFromViewButtonText}>Modifier la recette</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <RecipeForm
                initialValues={initialValues}
                submitLabel="Mettre à jour"
                onSubmit={handleUpdate}
              />
              <View style={styles.deleteWrapper}>
                <Text style={styles.deleteLabel}>Danger</Text>
                <Pressable
                  style={[styles.deleteButton, deleting && styles.deleteDisabled]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Text style={styles.deleteButtonText}>
                    {deleting ? "Suppression…" : "Supprimer cette recette"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
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
  containerWeb: {
    paddingTop: layout.webNavOffset + spacing.screen,
  },
  heading: {
    fontSize: 28,
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
    paddingVertical: 10,
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
  editFromViewButton: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: radii.lg,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  editFromViewButtonText: {
    color: colors.accent,
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
  deleteButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: "700",
  },
  deleteDisabled: {
    opacity: 0.6,
  },
});
