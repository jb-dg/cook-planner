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
  const isLunch = slot.key === "lunch";
  const dotColor = isLunch ? "#DDA15E" : "#BC6C25";

  return (
    <View style={[styles.slot, filled ? styles.slotFilled : styles.slotEmpty]}>
      {/* Slot header */}
      <View style={styles.slotHeader}>
        <Text style={[styles.slotLabel, !isLunch && styles.slotLabelDinner]}>
          {isLunch ? "Déjeuner" : "Dîner"}
        </Text>
        {filled && (
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

      {filled ? (
        /* Filled state: bold recipe name + dot row */
        <View style={styles.filledBody}>
          <TextInput
            value={meal.recipe}
            onChangeText={onChangeText}
            editable={!syncing && !saving}
            style={styles.recipeName}
            multiline
            scrollEnabled={false}
            placeholderTextColor="#A5A58D"
          />
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            {!isLunch && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
          </View>
        </View>
      ) : (
        /* Empty state: add button + free-typing input */
        <View style={styles.emptyBody}>
          <Pressable style={styles.addRow} onPress={onOpenRecipePicker}>
            <View style={styles.addCircle}>
              <Feather name="plus" size={16} color="#A5A58D" />
            </View>
            <Text style={styles.addText}>
              Ajouter {isLunch ? "un déjeuner" : "un dîner"}
            </Text>
          </Pressable>
          <TextInput
            value={meal.recipe}
            onChangeText={onChangeText}
            editable={!syncing && !saving}
            placeholder="Saisir directement..."
            placeholderTextColor="#A5A58D"
            style={styles.freeInput}
          />
        </View>
      )}
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
    backgroundColor: "transparent",
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
  filledBody: {
    gap: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D2D2A",
    lineHeight: 24,
    paddingVertical: 0,
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
  emptyBody: {
    gap: spacing.base * 0.75,
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
  freeInput: {
    fontSize: 13,
    color: "#6B705C",
    borderTopWidth: 1,
    borderTopColor: "rgba(165, 165, 141, 0.2)",
    paddingTop: spacing.base * 0.8,
    paddingVertical: 0,
  },
});
