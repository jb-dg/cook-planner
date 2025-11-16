import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { colors, radii, spacing } from "../../../theme/design";
import { mapRecipe, Recipe } from "../../../features/recipes/types";

export default function RecipesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRecipes = useMemo(() => recipes.length > 0, [recipes]);

  const fetchRecipes = useCallback(async () => {
    if (!session) {
      setRecipes([]);
      return;
    }
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select(
          "id,title,duration,difficulty,servings,description,ingredients"
        )
        .eq("user_id", session.user.id)
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
      setRecipes([]);
      setLoading(false);
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
      if (!session) {
        return;
      }
      fetchRecipes();
    }, [session, fetchRecipes])
  );

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchRecipes();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchRecipes]);

  const handleOpenRecipe = (recipeId: string) => {
    router.push({
      pathname: "/(tabs)/recipes/[id]",
      params: { id: recipeId },
    });
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <Pressable
      onPress={() => handleOpenRecipe(item.id)}
      style={({ pressed }) => [
        styles.recipeCard,
        pressed && styles.recipeCardPressed,
      ]}
    >
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.recipeMeta}>
          <Text style={styles.badge}>{item.difficulty}</Text>
          <Text style={styles.badge}>{item.servings} pers.</Text>
        </View>
      </View>
      {item.duration ? <Text style={styles.muted}>{item.duration}</Text> : null}
      {item.description ? (
        <Text style={styles.notes}>{item.description}</Text>
      ) : null}
      {item.ingredients.length ? (
        <View style={styles.ingredientsList}>
          {item.ingredients.map((ingredient) => (
            <View key={ingredient.id} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientQty}>
                {ingredient.quantity} {ingredient.unit}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Bibliothèque de recettes</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => router.push("/(tabs)/recipes/create")}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              Retrouve ici toutes tes préparations sauvegardées.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {hasRecipes ? (
              <Text style={styles.subheading}>Tes recettes</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.accentSecondary}
              size="large"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Tu n'as rien enregistré</Text>
              <Text style={styles.emptySubtitle}>
                Appuie sur “+” pour ajouter ta première recette.
              </Text>
            </View>
          )
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
    gap: 12,
  },
  header: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
  },
  subheading: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  recipeCard: {
    padding: spacing.card,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  recipeCardPressed: {
    opacity: 0.9,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  muted: {
    color: colors.muted,
    marginTop: 8,
  },
  notes: {
    marginTop: 8,
    color: colors.text,
    lineHeight: 20,
  },
  ingredientsList: {
    marginTop: 12,
    gap: 6,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ingredientName: {
    color: colors.text,
    fontWeight: "500",
  },
  ingredientQty: {
    color: colors.muted,
  },
  errorText: {
    color: colors.danger,
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    marginTop: 32,
    padding: spacing.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: 8,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    color: colors.muted,
    textAlign: "center",
  },
});
