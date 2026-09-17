import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/Text";

import { colors, radii, spacing } from "@/theme/design";
import {
  fetchCurrentWeekDays,
  getCurrentWeekDayLabels,
  getCurrentWeekRangeLabel,
  saveRecipeToCurrentWeekSlot,
} from "@/features/planner/lib/quickAddToWeek";
import { MEAL_SLOTS } from "@/features/planner/utils/constants";
import { DayPlan, MealKey } from "@/features/planner/utils/types";

import type { Recipe } from "../types";

type Props = {
  visible: boolean;
  recipe: Recipe | null;
  session: Session | null;
  onClose: () => void;
};

type SlotKey = `${number}-${MealKey}`;
const slotKey = (dayIndex: number, meal: MealKey): SlotKey => `${dayIndex}-${meal}`;

// Quick "add to planning" from a recipe card: picks a day + meal in the
// current week only (see quickAddToWeek.ts) and writes the recipe there,
// asking to confirm before overwriting an already-filled slot.
export default function AddRecipeToPlannerModal({ visible, recipe, session, onClose }: Props) {
  const [days, setDays] = useState<DayPlan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<SlotKey | null>(null);
  const [savedSlot, setSavedSlot] = useState<SlotKey | null>(null);

  useEffect(() => {
    if (!visible || !session) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSavedSlot(null);
    fetchCurrentWeekDays(session)
      .then((result) => {
        if (!cancelled) setDays(result);
      })
      .catch((err) => {
        console.error("fetch current week for quick add", err);
        if (!cancelled) setError("Impossible de charger le planning de la semaine.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, session]);

  useEffect(() => {
    if (!visible) {
      setDays(null);
      setPendingSlot(null);
      setSavedSlot(null);
      setError(null);
    }
  }, [visible]);

  const weekDayLabels = getCurrentWeekDayLabels();
  const weekRangeLabel = getCurrentWeekRangeLabel();

  const performSave = async (dayIndex: number, meal: MealKey) => {
    if (!recipe || !session) return;
    const key = slotKey(dayIndex, meal);
    setPendingSlot(key);
    try {
      const nextDays = await saveRecipeToCurrentWeekSlot(session, dayIndex, meal, recipe.title);
      setDays(nextDays);
      setSavedSlot(key);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("save recipe to planner slot", err);
      Alert.alert("Erreur", "Impossible d'ajouter la recette au planning. Réessaie plus tard.");
    } finally {
      setPendingSlot(null);
    }
  };

  const handleSelectSlot = (dayIndex: number, meal: MealKey) => {
    if (!recipe || !days) return;
    const dayLabel = weekDayLabels[dayIndex]?.day ?? "ce jour";
    const mealLabel = MEAL_SLOTS.find((slot) => slot.key === meal)?.label ?? "";
    const occupant = days[dayIndex]?.[meal]?.recipe?.trim();

    if (occupant && occupant !== recipe.title) {
      Alert.alert(
        "Remplacer ce repas ?",
        `« ${occupant} » est déjà prévu pour ${mealLabel} · ${dayLabel}. Le remplacer par « ${recipe.title} » ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Remplacer", style: "destructive", onPress: () => performSave(dayIndex, meal) },
        ],
      );
      return;
    }

    performSave(dayIndex, meal);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Ajouter au planning</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {recipe?.title ?? "Recette"} · Semaine du {weekRangeLabel}
            </Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {weekDayLabels.map((label, dayIndex) => (
              <View key={label.day} style={styles.dayRow}>
                <View style={styles.dayLabelBlock}>
                  <Text style={styles.dayName}>{label.day}</Text>
                  <Text style={styles.dayDate}>{label.dateLabel}</Text>
                </View>
                <View style={styles.mealChipsRow}>
                  {MEAL_SLOTS.map(({ key, label: mealLabel }) => {
                    const key2 = slotKey(dayIndex, key);
                    const occupant = days?.[dayIndex]?.[key]?.recipe?.trim();
                    const isSaving = pendingSlot === key2;
                    const isSaved = savedSlot === key2;
                    return (
                      <Pressable
                        key={key2}
                        onPress={() => handleSelectSlot(dayIndex, key)}
                        disabled={isSaving || !!savedSlot}
                        style={({ pressed }) => [
                          styles.mealChip,
                          !!occupant && styles.mealChipFilled,
                          pressed && styles.mealChipPressed,
                        ]}
                      >
                        <Text style={styles.mealChipLabel}>{mealLabel}</Text>
                        {isSaving ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : isSaved ? (
                          <Feather name="check" size={13} color={colors.accent} />
                        ) : (
                          <Text style={styles.mealChipOccupant} numberOfLines={1}>
                            {occupant || "Libre"}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
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
    maxHeight: "85%",
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
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  loader: {
    marginTop: 24,
    marginBottom: 24,
  },
  list: {
    marginTop: 4,
  },
  listContent: {
    gap: 8,
    paddingBottom: spacing.base,
  },
  dayRow: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.base,
    gap: 8,
  },
  dayLabelBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  dayDate: {
    fontSize: 12,
    color: colors.muted,
  },
  mealChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  mealChip: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
  },
  mealChipFilled: {
    borderColor: colors.accentTertiary,
  },
  mealChipPressed: {
    opacity: 0.85,
  },
  mealChipLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.muted,
  },
  mealChipOccupant: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
