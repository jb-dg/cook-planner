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
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { colors, radii, spacing } from "../../../theme/design";
import { Recipe } from "../../recipes/types";
import { DayPlan, MealKey, RecipePickerTarget } from "../utils/types";
import { MEAL_SLOTS } from "../utils/constants";

type Props = {
  visible: boolean;
  session: Session | null;
  target: RecipePickerTarget | null;
  days: DayPlan[];
  weekDays: Array<{ day: string; date: string }>;
  recipes: Recipe[];
  recipesLoading: boolean;
  recipesError: string | null;
  sheetPaddingBottom: number;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onDayChange: (dayIndex: number, meal: MealKey, value: string) => void;
};

export const RecipePickerModal = ({
  visible,
  session,
  target,
  days,
  weekDays,
  recipes,
  recipesLoading,
  recipesError,
  sheetPaddingBottom,
  onClose,
  onSelectRecipe,
  onDayChange,
}: Props) => {
  const [recipeQuery, setRecipeQuery] = useState("");

  const recipePickerContext = useMemo(() => {
    if (!target) return null;
    const day = weekDays[target.dayIndex];
    const mealLabel =
      MEAL_SLOTS.find((slot) => slot.key === target.meal)?.label ?? "";
    return {
      dayLabel: day?.day ?? "Jour",
      dateLabel: (day as { date?: string })?.date ?? "",
      mealLabel,
    };
  }, [target, weekDays]);

  const recipePickerValue = useMemo(() => {
    if (!target) return "";
    const day = days[target.dayIndex];
    const meal = (day as Record<MealKey, { recipe?: string }> | undefined)?.[
      target.meal
    ];
    return meal?.recipe ?? "";
  }, [target, days]);

  const filteredRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(query)
    );
  }, [recipes, recipeQuery]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.sheetContainer,
          styles.recipeSheet,
          { paddingBottom: sheetPaddingBottom },
        ]}
      >
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetTitleGroup}>
            <Text style={styles.sheetTitle}>Ajouter un repas</Text>
            <Text style={styles.sheetSubtitle}>
              {recipePickerContext
                ? `${recipePickerContext.mealLabel} · ${recipePickerContext.dayLabel}`
                : "Choisis une option"}
            </Text>
            {recipePickerContext?.dateLabel ? (
              <Text style={styles.sheetSubtle}>
                {recipePickerContext.dateLabel}
              </Text>
            ) : null}
          </View>
          <Pressable style={styles.sheetClose} onPress={onClose}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.freeEntryCard}>
          <Text style={styles.sheetSectionLabel}>Entrée libre</Text>
          <TextInput
            value={recipePickerValue}
            onChangeText={(value) => {
              if (!target) return;
              onDayChange(target.dayIndex, target.meal, value);
            }}
            placeholder="Ajouter un repas personnalisé"
            placeholderTextColor={colors.muted}
            style={styles.freeEntryInput}
          />
          <Text style={styles.freeEntryHint}>
            Tape ton idée, elle sera enregistrée pour ce repas.
          </Text>
        </View>

        <View style={styles.sheetSectionHeader}>
          <Text style={styles.sheetSectionLabel}>Ou choisis une recette</Text>
          <View style={styles.sheetSearch}>
            <Feather name="search" size={14} color={colors.muted} />
            <TextInput
              placeholder="Rechercher dans ta bibliothèque"
              placeholderTextColor={colors.muted}
              style={styles.sheetSearchInput}
              value={recipeQuery}
              onChangeText={setRecipeQuery}
            />
          </View>
        </View>

        {recipesError ? (
          <Text style={styles.sheetErrorText}>{recipesError}</Text>
        ) : null}

        {recipesLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : !session ? (
          <View style={styles.sheetEmptyState}>
            <Text style={styles.sheetEmptyText}>
              Connecte-toi pour parcourir tes recettes.
            </Text>
          </View>
        ) : filteredRecipes.length ? (
          <ScrollView
            style={styles.recipeList}
            contentContainerStyle={styles.recipeListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredRecipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                style={({ pressed }) => [
                  styles.recipeOption,
                  pressed && styles.recipeOptionPressed,
                ]}
                onPress={() => onSelectRecipe(recipe)}
              >
                <View style={styles.recipeOptionHeader}>
                  <Text style={styles.recipeOptionTitle}>{recipe.title}</Text>
                  <View style={styles.recipeOptionBadges}>
                    {recipe.duration ? (
                      <Text style={styles.recipeBadge}>{recipe.duration}</Text>
                    ) : null}
                    <Text style={styles.recipeBadge}>
                      {recipe.servings} pers.
                    </Text>
                  </View>
                </View>
                {recipe.description ? (
                  <Text style={styles.recipeOptionDescription}>
                    {recipe.description}
                  </Text>
                ) : null}
                <Text style={styles.recipeOptionAction}>
                  Utiliser pour ce repas
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.sheetEmptyState}>
            <Text style={styles.sheetEmptyText}>
              Aucune recette trouvée avec ce filtre.
            </Text>
            <Text style={styles.sheetEmptySubtext}>
              Essaie un autre mot-clé ou ajoute une nouvelle recette.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
  recipeSheet: {
    maxHeight: "82%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitleGroup: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  sheetSubtle: {
    color: colors.muted,
    fontSize: 12,
  },
  sheetSectionLabel: {
    fontWeight: "700",
    color: colors.text,
  },
  sheetSectionHeader: {
    gap: 8,
    marginTop: spacing.base,
  },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
  },
  sheetSearchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 10,
  },
  sheetErrorText: {
    color: colors.danger,
    marginTop: 4,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  freeEntryCard: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  freeEntryInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  freeEntryHint: {
    color: colors.muted,
    fontSize: 12,
  },
  recipeList: {
    marginTop: spacing.base,
  },
  recipeListContent: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  recipeOption: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.card,
    gap: 6,
  },
  recipeOptionPressed: {
    opacity: 0.92,
  },
  recipeOptionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  recipeOptionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  recipeOptionBadges: {
    flexDirection: "row",
    gap: 6,
  },
  recipeBadge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  recipeOptionDescription: {
    color: colors.muted,
  },
  recipeOptionAction: {
    marginTop: 6,
    color: colors.accent,
    fontWeight: "700",
  },
  sheetEmptyState: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
    alignItems: "center",
  },
  sheetEmptyText: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetEmptySubtext: {
    color: colors.muted,
    textAlign: "center",
  },
});
