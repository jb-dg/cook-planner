import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing } from "../../../theme/design";
import { MealKey } from "../utils/types";

const shadowCard = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 2,
    shadowColor: "#000000",
  },
  default: {},
});

type Props = {
  slot: { key: MealKey; label: string };
  meal: { recipe: string };
  session: Session | null;
  recipesLength: number;
  syncing: boolean;
  saving: boolean;
  recipesLoading: boolean;
  onChangeText: (value: string) => void;
  onBlur: () => void;
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
  onBlur,
  onOpenRecipePicker,
}: Props) => {
  // isEditing freezes the visual state while the keyboard is open to prevent
  // layout changes (slotEmpty → slotFilled) from stealing focus
  const [isEditing, setIsEditing] = useState(false);
  const [editingStartedFilled, setEditingStartedFilled] = useState(false);

  const filled = !!meal.recipe?.trim();
  // Keep the card visual state stable during edition on Android:
  // - if editing starts empty, keep empty visuals while typing
  // - if editing starts filled, keep filled visuals while editing
  const showAsFilled = isEditing ? editingStartedFilled : filled;
  const showReadOnlyDecor = showAsFilled && !isEditing;
  const isLunch = slot.key === "lunch";
  const dotColor = isLunch ? "#DDA15E" : "#BC6C25";

  const handleFocus = () => {
    setEditingStartedFilled(filled);
    setIsEditing(true);
  };
  const handleBlur = () => {
    setIsEditing(false);
    setEditingStartedFilled(false);
    onBlur();
  };

  return (
    <View
      style={[styles.mealCardShadow, showAsFilled && styles.mealCardRaised]}
    >
      <View
        style={[
          styles.mealCardSurface,
          showAsFilled
            ? isLunch
              ? styles.mealCardLunch
              : styles.mealCardDinner
            : styles.mealCardEmpty,
        ]}
      >
        {/* Slot header */}
        <View style={styles.slotHeader}>
          <Text style={[styles.slotLabel, !isLunch && styles.slotLabelDinner]}>
            {isLunch ? "Déjeuner" : "Dîner"}
          </Text>
          {showReadOnlyDecor && (
            <Pressable
              hitSlop={10}
              onPress={onOpenRecipePicker}
              disabled={recipesLoading}
              style={[
                styles.recipeBtn,
                (!session || recipesLoading) && styles.recipeBtnDisabled,
              ]}
            >
              <Feather name="edit-2" size={14} color="#BC6C25" />
            </Pressable>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Add button — visible when empty and not editing */}
          {!filled && !isEditing && (
            <Pressable style={styles.addRow} onPress={onOpenRecipePicker}>
              <View style={styles.addCircle}>
                <Feather name="plus" size={16} color={colors.muted} />
              </View>
              <View style={styles.addTextBlock}>
                <Text style={styles.addText}>
                  Ajouter {isLunch ? "un déjeuner" : "un dîner"}
                </Text>
                <Text style={styles.addSubtext}>
                  Rechercher une recette ou saisir directement
                </Text>
              </View>
            </Pressable>
          )}

          {/* Single TextInput — never unmounts, style only changes on blur */}
          <TextInput
            value={meal.recipe}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!syncing}
            placeholder="Saisir directement..."
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              showAsFilled && styles.inputFilled,
              isEditing && styles.inputEditing,
            ]}
            multiline
            scrollEnabled={false}
          />

          {/* Dot row — only when filled and not editing */}
          {showReadOnlyDecor && (
            <View style={styles.dotRow}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              {!isLunch && (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mealCardShadow: {
    borderRadius: 24,
  },
  mealCardRaised: {
    ...shadowCard,
  },
  // mealCardSurface mirrors HearthWeeklyPlanner's mealCard
  mealCardSurface: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    gap: spacing.base * 0.7,
  },
  mealCardLunch: {
    backgroundColor: "#FBFBFA",
    minHeight: 118,
  },
  mealCardDinner: {
    backgroundColor: "#F4F0EA",
    minHeight: 118,
  },
  mealCardEmpty: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(184,179,164,0.28)",
    minHeight: 92,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // slotLabel mirrors mealLabelMuted / mealLabelAccent
  slotLabel: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
    letterSpacing: 3.1,
    textTransform: "uppercase",
    color: colors.accentTertiary,
  },
  slotLabelDinner: {
    color: colors.accent,
  },
  recipeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeBtnDisabled: {
    opacity: 0.4,
  },
  body: {
    gap: spacing.base * 0.75,
  },
  input: {
    fontSize: 13,
    color: "#6B705C",
    borderTopWidth: 1,
    borderTopColor: "rgba(165, 165, 141, 0.2)",
    paddingTop: spacing.base * 0.8,
    paddingVertical: 0,
    minHeight: 36,
  },
  inputFilled: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D2D2A",
    lineHeight: 24,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  inputEditing: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D2D2A",
    borderTopWidth: 0,
    paddingTop: 0,
  },
  dotRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(165, 165, 141, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  addTextBlock: {
    flexShrink: 1,
    gap: 1,
  },
  addText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 14,
  },
  addSubtext: {
    color: colors.muted,
    fontWeight: "500",
    fontSize: 11,
    opacity: 0.85,
  },
});
