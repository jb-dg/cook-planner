import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Recipe } from "@/features/recipes/types";
import { colors, radii, spacing } from "@/theme/design";

type Props = {
  visible: boolean;
  recipes: Recipe[];
  loading: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
};

export const RecipeSelectModal = ({
  visible,
  recipes,
  loading,
  onClose,
  onSelectRecipe,
}: Props) => {
  const [query, setQuery] = useState("");

  const filteredRecipes = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(trimmed),
    );
  }, [recipes, query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Ajouter depuis une recette</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Feather name="search" size={14} color={colors.muted} />
          <TextInput
            placeholder="Rechercher une recette"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : filteredRecipes.length ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredRecipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelectRecipe(recipe)}
              >
                <Text style={styles.optionTitle}>{recipe.title}</Text>
                <Text style={styles.optionMeta}>
                  {recipe.ingredients.length} ingrédient
                  {recipe.ingredients.length > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune recette trouvée.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.card,
    gap: spacing.base,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 10,
  },
  loader: {
    marginTop: spacing.base,
  },
  list: {
    marginTop: spacing.base,
  },
  listContent: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  option: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.card,
    gap: 4,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  optionMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  emptyState: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  emptyText: {
    color: colors.text,
    fontWeight: "700",
  },
});
