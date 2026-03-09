import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { spacing } from "../../../theme/design";
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

  const filled = !!meal.recipe?.trim();
  const showAsFilled = filled && !isEditing;
  const isLunch = slot.key === "lunch";
  const dotColor = isLunch ? "#DDA15E" : "#BC6C25";

  const handleFocus = () => setIsEditing(true);
  const handleBlur = () => {
    setIsEditing(false);
    onBlur();
  };

  return (
    <View style={[styles.slot, showAsFilled ? styles.slotFilled : styles.slotEmpty]}>
      {/* Slot header */}
      <View style={styles.slotHeader}>
        <Text style={[styles.slotLabel, !isLunch && styles.slotLabelDinner]}>
          {isLunch ? "Déjeuner" : "Dîner"}
        </Text>
        {showAsFilled && (
          <Pressable
            hitSlop={10}
            onPress={onOpenRecipePicker}
            disabled={recipesLoading}
            style={[styles.recipeBtn, (!session || recipesLoading) && styles.recipeBtnDisabled]}
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
              <Feather name="plus" size={16} color="#A5A58D" />
            </View>
            <Text style={styles.addText}>
              Ajouter {isLunch ? "un déjeuner" : "un dîner"}
            </Text>
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
          placeholderTextColor="#A5A58D"
          style={[
            styles.input,
            showAsFilled && styles.inputFilled,
            isEditing && styles.inputEditing,
          ]}
          multiline
          scrollEnabled={false}
        />

        {/* Dot row — only when filled and not editing */}
        {showAsFilled && (
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            {!isLunch && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slot: {
    borderRadius: 24,
    padding: 20,
    gap: spacing.base,
  },
  slotEmpty: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(165, 165, 141, 0.4)",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  slotFilled: {
    borderWidth: 0,
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(107, 112, 92, 1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#A5A58D",
  },
  slotLabelDinner: {
    color: "#BC6C25",
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
    paddingVertical: 4,
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
  addText: {
    color: "#A5A58D",
    fontWeight: "700",
    fontSize: 14,
  },
});
