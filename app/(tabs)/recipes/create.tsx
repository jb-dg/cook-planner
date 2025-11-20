import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { colors, spacing } from "../../../theme/design";
import RecipeForm from "./RecipeForm";
import {
  createEmptyFormState,
  RecipeInput,
} from "../../../features/recipes/types";

export default function CreateRecipeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const handleCreate = async (input: RecipeInput) => {
    if (!session) return;
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const payload = {
        user_id: session.user.id,
        household_id: scope.householdId,
        ...input,
      };
      const { error } = await supabase.from("recipes").insert(payload);
      if (error) throw error;
      router.back();
    } catch (error) {
      console.error("create recipe", error);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer la recette. Réessaie plus tard."
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Nouvelle recette</Text>
        <RecipeForm
          initialValues={createEmptyFormState()}
          submitLabel="Enregistrer la recette"
          onSubmit={handleCreate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: 16,
    paddingBottom: 180,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
});
