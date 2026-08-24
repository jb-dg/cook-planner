import { Session } from "@supabase/supabase-js";
import { addDays, isSameDay } from "date-fns";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { spacing } from "../../../theme/design";
import { MEAL_SLOTS } from "../utils/constants";
import { DayPlan, MealKey } from "../utils/types";
import { DayMealCard } from "./DayMealCard";

// const shadowShell = Platform.select({
//   ios: {
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 18,
//     shadowOffset: { width: 0, height: 8 },
//   },
//   // On Android, nested elevation clips child cards — the shell relies on its
//   // background color (#ECE9E4) for visual depth; child mealCards keep elevation: 3.
//   android: {
//     elevation: 4,
//     backgroundColor: "rgb(255, 255, 255)",
//   },
//   default: {},
// });

const shadowShell = {
  sm: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    android: {},
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.07,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 4,
      shadowColor: "#000",
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 8,
      shadowColor: "#000",
    },
    default: {},
  }),
};

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
  // "row" places the meal cards side by side — used in the iPad split
  // detail pane, where there's width to spare. Defaults to the phone's
  // stacked layout.
  layout?: "column" | "row";
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
  layout = "column",
}: Props) => {
  const dayColumns = useMemo(
    () =>
      days.map((item, index) => ({
        ...item,
        dayDate: addDays(referenceDate, index),
      })),
    [referenceDate, days],
  );

  const selectedDayIndex = useMemo(() => {
    const index = dayColumns.findIndex((col) =>
      isSameDay(col.dayDate, selectedDate),
    );
    return index >= 0 ? index : 0;
  }, [dayColumns, selectedDate]);

  const dayData = days[selectedDayIndex] || {};

  return (
    <View style={styles.container}>
      {/* Shell card — mirrors shellCard in HearthWeeklyPlanner */}
      <View style={styles.shellCardShadow}>
        {Platform.OS === "android" && (
          <View pointerEvents="none" style={styles.shellCardAndroidShadow} />
        )}
        <View style={styles.shellCardSurface}>
          {/* Meal slots */}
          <View
            style={[styles.mealGrid, layout === "row" && styles.mealGridRow]}
          >
            {MEAL_SLOTS.map((slot) => {
              const mealData = (
                dayData as Record<MealKey, { recipe?: string }>
              )[slot.key];
              const meal = { recipe: mealData?.recipe ?? "" };
              return (
                <View key={slot.key} style={layout === "row" && styles.mealGridItemRow}>
                  <DayMealCard
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
                    onRemove={() => {
                      onDayChange(selectedDayIndex, slot.key, "");
                      onBlur();
                    }}
                  />
                </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  shellCardShadow: {
    borderRadius: 26,
    position: "relative",
    ...shadowShell.sm,
  },
  shellCardAndroidShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: -1,
    right: -1,
    bottom: -2,
    borderRadius: 26,
    backgroundColor: "#000000",
    opacity: 0.12,
  },
  // shellCardSurface mirrors HearthWeeklyPlanner's shellCard
  shellCardSurface: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    gap: spacing.base * 0.6,
  },
  mealGrid: {
    gap: 14,
  },
  mealGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  mealGridItemRow: {
    flex: 1,
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
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteText: {
    fontSize: 13,
    color: "#6B705C",
    lineHeight: 18,
  },
});
