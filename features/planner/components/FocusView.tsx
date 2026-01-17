import { ComponentProps, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { colors, radii, shadows, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";
import { MEAL_SLOTS } from "../utils/constants";
import { DayMealCard } from "./DayMealCard";

type Props = {
  days: DayPlan[];
  referenceDate: Date;
  selectedDate: Date;
  session: Session | null;
  recipesLength: number;
  syncing: boolean;
  saving: boolean;
  recipesLoading: boolean;
  onDayChange: (dayIndex: number, meal: MealKey, value: string) => void;
  onOpenRecipePicker: (dayIndex: number, meal: MealKey) => void;
};

export const FocusView = ({
  days,
  referenceDate,
  selectedDate,
  session,
  recipesLength,
  syncing,
  saving,
  recipesLoading,
  onDayChange,
  onOpenRecipePicker,
}: Props) => {
  const dayColumns = useMemo(
    () =>
      days.map((item, index) => ({
        ...item,
        shortLabel: format(addDays(referenceDate, index), "EEE d MMM", {
          locale: fr,
        }).replace(".", ""),
      })),
    [referenceDate, days]
  );

  const selectedDayIndex = useMemo(() => {
    const index = dayColumns.findIndex((_, dayIndex) =>
      isSameDay(addDays(referenceDate, dayIndex), selectedDate)
    );
    return index >= 0 ? index : 0;
  }, [dayColumns, referenceDate, selectedDate]);

  const day = dayColumns[selectedDayIndex];
  const dayData = days[selectedDayIndex] || {};
  const filledCount = MEAL_SLOTS.filter(
    (slot) =>
      !!(
        (dayData as Record<MealKey, { recipe?: string }>)[slot.key]?.recipe ??
        ""
      ).trim()
  ).length;
  const missingMeals = Math.max(MEAL_SLOTS.length - filledCount, 0);
  const dayStatusIcon: ComponentProps<typeof Feather>["name"] =
    missingMeals === 0 ? "check" : "alert-circle";

  return (
    <View style={styles.dayList}>
      <View style={[styles.modernDayCard, styles.modernDayCardActive]}>
        <View style={styles.modernDayHeader}>
          <View style={styles.modernDayHeaderMain}>
            <View style={styles.modernDayInfo}>
              <Text style={styles.modernDayDate}>{day.shortLabel}</Text>
            </View>
            <View
              style={[
                styles.modernDayProgressBadge,
                missingMeals === 0 && styles.modernDayProgressBadgeComplete,
              ]}
            >
              <Feather
                name={dayStatusIcon}
                size={12}
                color={
                  missingMeals === 0 ? colors.background : colors.text
                }
              />
              <Text
                style={[
                  styles.modernDayProgressText,
                  missingMeals === 0 &&
                    styles.modernDayProgressTextComplete,
                ]}
              >
                {filledCount}/{MEAL_SLOTS.length} repas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.modernMealList}>
          {MEAL_SLOTS.map((slot) => {
            const mealData = (dayData as Record<MealKey, { recipe?: string }>)[
              slot.key
            ];
            const meal = { recipe: mealData?.recipe ?? "" };
            return (
              <DayMealCard
                key={slot.key}
                slot={slot}
                meal={meal}
                session={session}
                recipesLength={recipesLength}
                syncing={syncing}
                saving={saving}
                recipesLoading={recipesLoading}
                onChangeText={(value) =>
                  onDayChange(selectedDayIndex, slot.key, value)
                }
                onOpenRecipePicker={() =>
                  onOpenRecipePicker(selectedDayIndex, slot.key)
                }
              />
            );
          })}
        </View>

        {((dayData as DayPlan).notes ?? "").trim() ? (
          <View style={styles.modernDayNote}>
            <Feather name="file-text" size={14} color={colors.muted} />
            <View style={styles.modernDayNoteContent}>
              <Text style={styles.modernDayNoteLabel}>Note</Text>
              <Text style={styles.modernDayNoteText}>
                {(dayData as DayPlan).notes}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dayList: {
    gap: spacing.base * 1.5,
    alignItems: "center",
  },
  modernDayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.base * 1.5,
    ...shadows.card,
    width: "100%",
    maxWidth: 720,
  },
  modernDayCardActive: {
    borderColor: colors.accent,
    borderWidth: 1,
  },
  modernDayHeader: {
    gap: spacing.base * 0.75,
  },
  modernDayHeaderMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  modernDayInfo: {
    flex: 1,
    gap: 2,
  },
  modernDayDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  modernDayProgressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modernDayProgressBadgeComplete: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modernDayProgressText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  modernDayProgressTextComplete: {
    color: colors.background,
  },
  modernMealList: {
    gap: spacing.base,
  },
  modernDayNote: {
    flexDirection: "row",
    gap: spacing.base * 0.75,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modernDayNoteContent: {
    flex: 1,
    gap: 4,
  },
  modernDayNoteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
  },
  modernDayNoteText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
