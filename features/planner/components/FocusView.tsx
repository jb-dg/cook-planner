import { Session } from "@supabase/supabase-js";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { spacing } from "../../../theme/design";
import { MEAL_SLOTS } from "../utils/constants";
import { DayPlan, MealKey } from "../utils/types";
import { DayMealCard } from "./DayMealCard";

const shadowShell = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  // On Android, nested elevation clips child cards — the shell relies on its
  // background color (#ECE9E4) for visual depth; child mealCards keep elevation: 3.
  android: { elevation: 4, backgroundColor: "rgb(255, 255, 255)" },
  default: {},
});

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
  onBlur: () => void;
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
  onBlur,
}: Props) => {
  const dayColumns = useMemo(
    () =>
      days.map((item, index) => ({
        ...item,
        dayDate: addDays(referenceDate, index),
        abbrev: format(addDays(referenceDate, index), "EEE", { locale: fr })
          .replace(".", "")
          .toUpperCase()
          .slice(0, 3),
        dateNum: format(addDays(referenceDate, index), "d MMM", {
          locale: fr,
        }).toUpperCase(),
      })),
    [referenceDate, days],
  );

  const selectedDayIndex = useMemo(() => {
    const index = dayColumns.findIndex((col) =>
      isSameDay(col.dayDate, selectedDate),
    );
    return index >= 0 ? index : 0;
  }, [dayColumns, selectedDate]);

  const day = dayColumns[selectedDayIndex];
  const dayData = days[selectedDayIndex] || {};
  const filledCount = MEAL_SLOTS.filter(
    (slot) =>
      !!(
        (dayData as Record<MealKey, { recipe?: string }>)[slot.key]?.recipe ??
        ""
      ).trim(),
  ).length;
  const isComplete = filledCount === MEAL_SLOTS.length;

  return (
    <View style={styles.container}>
      {/* Day header: abbrev + date — mirrors dayHeader in HearthWeeklyPlanner */}
      <View style={styles.dayHeader}>
        <Text style={[styles.dayShort, isComplete && styles.dayShortComplete]}>
          {day.abbrev}
        </Text>
        <Text style={styles.dayDate}>{day.dateNum}</Text>
        {isComplete && <View style={styles.completeDot} />}
      </View>

      {/* Shell card — mirrors shellCard in HearthWeeklyPlanner */}
      <View style={styles.shellCard}>
        {/* Status chip */}
        <View
          style={[styles.statusChip, isComplete && styles.statusChipComplete]}
        >
          <Text
            style={[styles.statusText, isComplete && styles.statusTextComplete]}
          >
            {isComplete
              ? "Complet ✓"
              : `${filledCount}/${MEAL_SLOTS.length} repas`}
          </Text>
        </View>

        {/* Meal slots */}
        <View style={styles.mealGrid}>
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
                onBlur={onBlur}
                onOpenRecipePicker={() =>
                  onOpenRecipePicker(selectedDayIndex, slot.key)
                }
              />
            );
          })}
        </View>

        {((dayData as DayPlan).notes ?? "").trim() ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{(dayData as DayPlan).notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  // dayHeader mirrors HearthWeeklyPlanner's dayHeader
  dayHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  dayShort: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.4,
    color: "#2F2F2C",
  },
  dayShortComplete: {
    color: "#BF6B1F",
  },
  dayDate: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    letterSpacing: 2.3,
    color: "#A8A38F",
  },
  completeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#BC6C25",
    marginLeft: 4,
    marginBottom: 2,
  },
  // shellCard mirrors HearthWeeklyPlanner's shellCard
  shellCard: {
    borderRadius: 42,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    gap: spacing.base * 1.2,
    ...shadowShell,
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F5EFE4",
    borderWidth: 1,
    borderColor: "#E4D9C8",
  },
  statusChipComplete: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderColor: "rgba(188, 108, 37, 0.22)",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusTextComplete: {
    color: "#BC6C25",
  },
  mealGrid: {
    gap: spacing.base,
  },
  noteBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F5EFE4",
    gap: 4,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A5A58D",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteText: {
    fontSize: 13,
    color: "#6B705C",
    lineHeight: 18,
  },
});
