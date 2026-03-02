import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { colors, gradients, radii, spacing } from "../../../theme/design";
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
  const mealGradient = slot.key === "lunch" ? gradients.lunch : gradients.dinner;
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
          {filled ? (
            <LinearGradient
              colors={mealGradient}
              style={styles.modernMealIconWrapper}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name={mealIcon} size={20} color="#FFF" />
            </LinearGradient>
          ) : (
            <View style={styles.modernMealIconWrapper}>
              <Feather name={mealIcon} size={20} color={colors.accent} />
            </View>
          )}
          <View style={styles.modernMealLabels}>
            <Text style={styles.modernMealLabel}>{slot.label}</Text>
            {!filled && (
              <Text style={styles.modernMealStatus}>Non planifié</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernMealLabels: {
    flex: 1,
    gap: 4,
  },
  modernMealLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  modernMealStatus: {
    fontSize: 12,
    fontWeight: "600",
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
