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

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { colors, radii, spacing } from "../../theme/design";

type Difficulty = "Facile" | "Moyen" | "Expert";

type Recipe = {
  id: string;
  title: string;
  duration: string;
  difficulty: Difficulty;
  notes: string | null;
};

const DIFFICULTIES: Difficulty[] = ["Facile", "Moyen", "Expert"];

const mapRecipe = (row: {
  id: string | number;
  title: string;
  duration: string;
  difficulty: string;
  notes?: string | null;
}): Recipe => ({
  id: String(row.id),
  title: row.title,
  duration: row.duration,
  difficulty: (row.difficulty as Difficulty) ?? "Facile",
  notes: row.notes ?? null,
});

export default function RecipesScreen() {
  const { session } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Facile");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => Boolean(title.trim()) && Boolean(duration.trim()) && !saving,
    [title, duration, saving]
  );

  const fetchRecipes = useCallback(async () => {
    if (!session) {
      setRecipes([]);
      return;
    }
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select("id,title,duration,difficulty,notes")
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
        /* already handled */
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

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchRecipes();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchRecipes]);

  const resetForm = () => {
    setTitle("");
    setDuration("");
    setNotes("");
    setDifficulty("Facile");
  };

  const handleSaveRecipe = async () => {
    if (!session || !canSave) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        user_id: session.user.id,
        title: title.trim(),
        duration: duration.trim(),
        difficulty,
        notes: notes.trim() ? notes.trim() : null,
      };

      const { data, error: insertError } = await supabase
        .from("recipes")
        .insert(payload)
        .select("id,title,duration,difficulty,notes")
        .single();

      if (insertError || !data) {
        throw insertError ?? new Error("Réponse invalide.");
      }

      setRecipes((current) => [mapRecipe(data), ...current]);
      resetForm();
    } catch (err) {
      console.error("save recipe", err);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer la recette. Réessaie plus tard."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.difficulty}>{item.difficulty}</Text>
      </View>
      <Text style={styles.muted}>{item.duration}</Text>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
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
            <Text style={styles.heading}>Bibliothèque de recettes</Text>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Ajouter une recette</Text>
              <TextInput
                placeholder="Titre de la recette"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                editable={!saving}
              />
              <TextInput
                placeholder="Durée (ex: 30 min)"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                editable={!saving}
              />
              <View>
                <Text style={styles.label}>Difficulté</Text>
                <View style={styles.difficultyRow}>
                  {DIFFICULTIES.map((item) => (
                    <Pressable
                      key={item}
                      style={[
                        styles.difficultyChip,
                        difficulty === item && styles.difficultyChipActive,
                      ]}
                      onPress={() => setDifficulty(item)}
                      disabled={saving}
                    >
                      <Text
                        style={[
                          styles.difficultyChipText,
                          difficulty === item && styles.difficultyChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <TextInput
                placeholder="Notes ou ingrédients (optionnel)"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!saving}
              />
              <Pressable
                disabled={!canSave}
                onPress={handleSaveRecipe}
                style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Enregistrement…" : "Enregistrer la recette"}
                </Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {!loading && recipes.length > 0 ? (
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
              <Text style={styles.emptyTitle}>Aucune recette enregistrée</Text>
              <Text style={styles.emptySubtitle}>
                Ajoute ta première recette pour la retrouver facilement ici.
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
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  formCard: {
    padding: spacing.card,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: 6,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  difficultyChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  difficultyChipText: {
    color: colors.text,
    fontWeight: "500",
  },
  difficultyChipTextActive: {
    color: "#fff",
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
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
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
  saveButton: {
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
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
