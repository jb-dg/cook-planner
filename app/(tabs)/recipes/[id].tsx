import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { colors, spacing, radii } from "../../../theme/design";
import RecipeForm from "./RecipeForm";
import {
  mapRecipe,
  recipeToFormState,
  RecipeFormState,
  RecipeInput,
} from "../../../features/recipes/types";

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [initialValues, setInitialValues] = useState<RecipeFormState | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Modifier la recette</Text>
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
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  deleteWrapper: {
    marginTop: 24,
    gap: 8,
  },
  deleteLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: "600",
  },
  deleteDisabled: {
    opacity: 0.6,
  },
});
