import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radii, spacing } from "@/theme/design";

import type { Recipe } from "../types";

type Props = {
  visible: boolean;
  bookName: string;
  availableRecipes: Recipe[];
  onAdd: (recipeId: string) => void;
  onClose: () => void;
};

// Was a plain list at the very bottom of the book screen, after every
// recipe already in the book — for a well-filled book that meant scrolling
// past the whole grid just to add one more. A sheet reachable from the
// header fixes that regardless of how many recipes the book already has.
export default function AddRecipesToBookModal({
  visible,
  bookName,
  availableRecipes,
  onAdd,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredRecipes = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return availableRecipes;
    return availableRecipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(trimmed),
    );
  }, [availableRecipes, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Ajouter des recettes</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              À &laquo;&nbsp;{bookName}&nbsp;&raquo;
            </Text>
          </View>
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

        {filteredRecipes.length ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Pressable style={styles.addButton} onPress={() => onAdd(recipe.id)}>
                  <Feather name="plus" size={14} color={colors.accent} />
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {availableRecipes.length
                ? "Aucune recette trouvée avec ce filtre."
                : "Toutes les recettes sont déjà dans ce livre."}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

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
    shadowColor: "rgba(66, 58, 50, 0.25)",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
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
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
  list: {
    marginTop: 4,
  },
  listContent: {
    gap: 8,
    paddingBottom: spacing.base,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  addButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
  },
});
