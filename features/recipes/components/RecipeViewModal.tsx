import { Feather } from "@expo/vector-icons";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii, spacing } from "@/theme/design";

import type { Recipe } from "../types";

type RecipeViewModalProps = {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (recipeId: string) => void;
};

export default function RecipeViewModal({
  recipe,
  visible,
  onClose,
  onEdit,
}: RecipeViewModalProps) {
  const ingredients =
    recipe?.ingredients.filter(
      (ingredient) => ingredient.name.trim() || ingredient.quantity.trim()
    ) ?? [];
  const steps = recipe?.steps.filter((step) => step.text.trim()) ?? [];

  const openSource = () => {
    if (!recipe?.sourceUrl) return;
    void Linking.openURL(recipe.sourceUrl);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={Platform.OS === "web"}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalScreen} edges={["top", "left", "right"]}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.titleBlock}>
                <Text style={styles.kicker}>Recette</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {recipe?.title ?? "Recette"}
                </Text>
              </View>
              <Pressable style={styles.iconButton} onPress={onClose} hitSlop={8}>
                <Feather name="x" size={18} color="#2D2D2A" />
              </Pressable>
            </View>

            {recipe ? (
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.metaRow}>
                  <View style={[styles.metaChip, styles.metaChipAccent]}>
                    <Text style={[styles.metaChipText, styles.metaChipTextAccent]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{recipe.servings} pers.</Text>
                  </View>
                  {recipe.duration ? (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{recipe.duration}</Text>
                    </View>
                  ) : null}
                </View>

                {recipe.coverImageUrl || recipe.imageUrls[0] ? (
                  <Image
                    source={{ uri: recipe.coverImageUrl || recipe.imageUrls[0] }}
                    style={styles.coverImage}
                  />
                ) : null}

                {recipe.imageUrls.length > 1 ? (
                  <View style={styles.photoStrip}>
                    {recipe.imageUrls.map((url) => (
                      <Image key={url} source={{ uri: url }} style={styles.photoThumb} />
                    ))}
                  </View>
                ) : null}

                {recipe.description.trim() ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Note</Text>
                    <Text style={styles.bodyText}>{recipe.description}</Text>
                  </View>
                ) : null}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Ingrédients</Text>
                  {ingredients.length ? (
                    ingredients.map((ingredient) => (
                      <View key={ingredient.id} style={styles.ingredientRow}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientValue}>
                          {[ingredient.quantity, ingredient.unit].filter(Boolean).join(" ")}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.bodyText}>Aucun ingrédient renseigné.</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Étapes</Text>
                  {steps.length ? (
                    steps.map((step, index) => (
                      <View key={step.id} style={styles.stepRow}>
                        <View style={styles.stepIndex}>
                          <Text style={styles.stepIndexText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step.text}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.bodyText}>Aucune étape renseignée.</Text>
                  )}
                </View>

                {recipe.sourceUrl ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Source</Text>
                    <Pressable style={styles.sourceButton} onPress={openSource}>
                      <Feather name="external-link" size={14} color={colors.accent} />
                      <Text style={styles.sourceText} numberOfLines={2}>
                        {recipe.sourceUrl}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}

            {recipe && onEdit ? (
              <View style={styles.footer}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => onEdit(recipe.id)}
                >
                  <Feather name="edit-2" size={14} color={colors.accent} />
                  <Text style={styles.secondaryButtonText}>Modifier</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalScreen: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "rgba(45, 45, 42, 0.35)" : colors.background,
  },
  backdrop: {
    flex: 1,
    justifyContent: Platform.OS === "web" ? "center" : "flex-end",
    alignItems: "center",
    padding: Platform.OS === "web" ? spacing.screen : 0,
  },
  sheet: {
    width: "100%",
    maxWidth: 720,
    maxHeight: Platform.OS === "web" ? "86%" : "94%",
    borderTopLeftRadius: Platform.OS === "web" ? 28 : 30,
    borderTopRightRadius: Platform.OS === "web" ? 28 : 30,
    borderBottomLeftRadius: Platform.OS === "web" ? 28 : 0,
    borderBottomRightRadius: Platform.OS === "web" ? 28 : 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    paddingHorizontal: spacing.card,
    paddingTop: Platform.OS === "web" ? spacing.card : spacing.card + 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(228, 217, 200, 0.7)",
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: colors.accentTertiary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 31,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  content: {
    padding: spacing.card,
    gap: 18,
    paddingBottom: spacing.card + 72,
  },
  coverImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
  },
  photoStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoThumb: {
    width: 82,
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    backgroundColor: "#F5EFE4",
    borderWidth: 1,
    borderColor: "#E4D9C8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipAccent: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderColor: "rgba(188, 108, 37, 0.2)",
  },
  metaChipText: {
    color: "#6B705C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metaChipTextAccent: {
    color: colors.accent,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.accentTertiary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(228, 217, 200, 0.55)",
  },
  ingredientName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  ingredientValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  stepIndexText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  sourceButton: {
    minHeight: 42,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.18)",
    backgroundColor: "rgba(188, 108, 37, 0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceText: {
    flex: 1,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    padding: spacing.card,
    borderTopWidth: 1,
    borderTopColor: "rgba(228, 217, 200, 0.7)",
    backgroundColor: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.35)",
    backgroundColor: "rgba(188, 108, 37, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
});
