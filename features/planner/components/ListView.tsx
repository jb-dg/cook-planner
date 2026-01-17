import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { colors, radii, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";
import { MEAL_SLOTS } from "../utils/constants";

type Props = {
  days: DayPlan[];
  referenceDate: Date;
  selectedDate: Date;
  syncing: boolean;
  saving: boolean;
  onDayChange: (dayIndex: number, meal: MealKey, value: string) => void;
  onOpenRecipePicker: (dayIndex: number, meal: MealKey) => void;
  onSelectDate: (date: Date) => void;
};

export const ListView = ({
  days,
  referenceDate,
  selectedDate,
  syncing,
  saving,
  onDayChange,
  onOpenRecipePicker,
  onSelectDate,
}: Props) => {
  return (
    <View style={styles.weekList}>
      {days.map((day, dayIndex) => {
        const dayDate = addDays(referenceDate, dayIndex);
        const dayData = days[dayIndex] || {};
        const filledCount = MEAL_SLOTS.filter(
          (slot) =>
            !!(
              (dayData as Record<MealKey, { recipe?: string }>)[slot.key]
                ?.recipe ?? ""
            ).trim()
        ).length;
        const missingMeals = Math.max(MEAL_SLOTS.length - filledCount, 0);
        const dayLabel = format(dayDate, "EEE d MMM", {
          locale: fr,
        }).replace(".", "");
        const isActive = isSameDay(dayDate, selectedDate);

        return (
          <View
            key={day.day}
            style={[
              styles.weekListRow,
              isActive && styles.weekListRowActive,
            ]}
          >
            <Pressable
              style={styles.weekListMeta}
              hitSlop={6}
              onPress={() => onSelectDate(dayDate)}
            >
              <Text style={styles.weekListDay}>{dayLabel}</Text>
              <Text
                style={[
                  styles.weekListStatus,
                  missingMeals === 0 && styles.weekListStatusDone,
                ]}
              >
                {missingMeals === 0 ? "Complet" : `${missingMeals} à planifier`}
              </Text>
            </Pressable>
            <View style={styles.weekListMeals}>
              {MEAL_SLOTS.map((slot) => {
                const meal = (dayData as Record<MealKey, { recipe?: string }>)[
                  slot.key
                ] ?? { recipe: "" };

                const mealIcon: ComponentProps<typeof Feather>["name"] =
                  slot.key === "lunch" ? "sun" : "moon";
                return (
                  <View key={slot.key} style={styles.weekListMeal}>
                    <View style={styles.weekListMealLabel}>
                      <Feather
                        name={mealIcon}
                        size={12}
                        color={colors.muted}
                      />
                      <Text style={styles.weekListMealText}>{slot.label}</Text>
                    </View>
                    <View style={styles.weekListInputRow}>
                      <TextInput
                        value={meal.recipe}
                        onChangeText={(value) =>
                          onDayChange(dayIndex, slot.key, value)
                        }
                        editable={!syncing && !saving}
                        placeholder="Ajouter un repas"
                        placeholderTextColor={colors.muted}
                        style={styles.weekListInput}
                      />
                      <Pressable
                        hitSlop={8}
                        style={styles.weekListRecipeButton}
                        onPress={() => onOpenRecipePicker(dayIndex, slot.key)}
                      >
                        <Feather
                          name="book-open"
                          size={14}
                          color={colors.accent}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  weekList: {
    width: "100%",
    gap: spacing.base * 0.75,
    alignItems: "center",
  },
  weekListRow: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.base * 1.1,
    paddingHorizontal: spacing.base * 1.2,
    gap: spacing.base * 0.7,
    width: "100%",
    maxWidth: 780,
  },
  weekListRowActive: {
    borderColor: colors.accent,
  },
  weekListMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekListDay: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  weekListStatus: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 11,
  },
  weekListStatusDone: {
    color: colors.accent,
  },
  weekListMeals: {
    gap: spacing.base * 0.55,
  },
  weekListMeal: {
    gap: spacing.base * 0.25,
  },
  weekListMealLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weekListMealText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12.5,
  },
  weekListInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  weekListInput: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  weekListRecipeButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});
