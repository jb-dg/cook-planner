import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { colors, radii, spacing } from "../../../theme/design";
import { MealKey } from "../utils/types";

type Props = {
  slot: { key: MealKey; label: string };
  meal: { recipe: string };
  session: Session | null;
  recipesLength: number;
  syncing: boolean;
  saving: boolean;
  recipesLoading: boolean;
  onChangeText: (value: string) => void;
  onOpenRecipePicker: () => void;
};

export const DayMealCard = ({
  slot,
  meal,
  session,
  recipesLength,
  syncing,
  saving,
  recipesLoading,
  onChangeText,
  onOpenRecipePicker,
}: Props) => {
  const filled = !!meal.recipe?.trim();
  const mealIcon: ComponentProps<typeof Feather>["name"] =
    slot.key === "lunch" ? "sun" : "moon";
  const hint =
    !session && !recipesLength
      ? "Saisie libre ou ajoute tes recettes en te connectant"
      : "Saisie libre ou recette enregistrée";

  return (
    <View style={styles.modernMealCard}>
      <View
        style={[
          styles.modernMealHeader,
          filled && styles.modernMealHeaderFilled,
        ]}
      >
        <View style={styles.modernMealLeft}>
          <View
            style={[
              styles.modernMealIconWrapper,
              filled && styles.modernMealIconWrapperFilled,
            ]}
          >
            <Feather
              name={mealIcon}
              size={16}
              color={filled ? colors.background : colors.accent}
            />
          </View>
          <View style={styles.modernMealLabels}>
            <Text style={styles.modernMealLabel}>{slot.label}</Text>
            {!filled && (
              <Text style={styles.modernMealStatus}>À planifier</Text>
            )}
          </View>
        </View>
        <Pressable
          style={[
            styles.modernRecipeButton,
            (!session || recipesLoading) && styles.modernRecipeButtonDisabled,
          ]}
          hitSlop={10}
          onPress={onOpenRecipePicker}
          disabled={recipesLoading}
        >
          <Feather name="book-open" size={16} color={colors.accent} />
        </Pressable>
      </View>
      <View
        style={[
          styles.modernMealInputWrapper,
          filled && styles.modernMealInputWrapperFilled,
        ]}
      >
        <TextInput
          value={meal.recipe}
          onChangeText={onChangeText}
          editable={!syncing && !saving}
          placeholder={
            filled ? "Modifier la recette..." : "Recette ou note libre"
          }
          placeholderTextColor={colors.muted}
          style={styles.modernMealInput}
          multiline
        />
        {!filled && <Text style={styles.modernMealHint}>{hint}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modernMealCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  modernMealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.base,
    gap: spacing.base,
  },
  modernMealHeaderFilled: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modernMealLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.75,
  },
  modernMealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  modernMealIconWrapperFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modernMealLabels: {
    flex: 1,
    gap: 4,
  },
  modernMealLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  modernMealStatus: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.muted,
  },
  modernRecipeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modernRecipeButtonDisabled: {
    opacity: 0.5,
  },
  modernMealInputWrapper: {
    padding: spacing.base,
    backgroundColor: colors.surfaceAlt,
  },
  modernMealInputWrapperFilled: {
    backgroundColor: colors.surface,
  },
  modernMealInput: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    minHeight: 40,
    paddingVertical: 0,
  },
  modernMealHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing.base * 0.5,
  },
});
