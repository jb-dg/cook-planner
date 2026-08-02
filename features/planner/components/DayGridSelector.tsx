import { addDays, format, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";

type Props = {
  referenceDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  days?: DayPlan[];
};

const hasPlannedMeal = (day?: DayPlan) => {
  if (!day) return false;
  const trackedMeals: MealKey[] = ["lunch", "dinner"];
  return trackedMeals.some((slot) =>
    !!(day as Record<MealKey, { recipe?: string } | undefined>)[slot]?.recipe?.trim(),
  );
};

export const DayGridSelector = ({
  referenceDate,
  selectedDate,
  onSelectDate,
  days,
}: Props) => {
  return (
    <View style={styles.dayGrid}>
      {Array.from({ length: 7 }).map((_, dayIndex) => {
        const dayDate = addDays(referenceDate, dayIndex);
        const isActiveDay = isSameDay(dayDate, selectedDate);
        const isCurrentDay = isToday(dayDate);
        const isPlanned = hasPlannedMeal(days?.[dayIndex]);
        const dayNumber = format(dayDate, "d", { locale: fr });
        const dayAbbrev = format(dayDate, "EEE", { locale: fr })
          .replace(".", "")
          .toUpperCase();

        return (
          <Pressable
            key={dayIndex}
            style={[
              styles.dayGridItem,
              isCurrentDay && !isActiveDay && styles.dayGridItemToday,
              isActiveDay && styles.dayGridItemActive,
            ]}
            onPress={() => onSelectDate(dayDate)}
          >
            <Text
              style={[
                styles.dayGridTitle,
                isActiveDay && styles.dayGridTitleActive,
              ]}
            >
              {dayAbbrev}
            </Text>
            <Text
              style={[
                styles.dayGridNumber,
                isActiveDay && styles.dayGridNumberActive,
              ]}
            >
              {dayNumber}
            </Text>
            {/* Dot presence means one thing only: a meal is planned that day.
                Selection only changes its color for contrast on the orange fill. */}
            <View
              style={[
                styles.dayGridDot,
                isPlanned && (isActiveDay ? styles.dayGridDotActive : styles.dayGridDotPlanned),
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dayGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: spacing.base * 0.15,
    columnGap: spacing.base * 0.15,
    marginTop: spacing.base * 0.3,
    justifyContent: "space-between",
    alignContent: "center",
    alignSelf: "center",
    width: "100%",
  },
  dayGridItem: {
    flex: 1,
    minHeight: 54,
    maxWidth: "14%",
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: spacing.base * 0.15,
    gap: spacing.base * 0.15,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.subtle,
  },
  // Today, when not the selected day: a subtle outline — distinct from the
  // filled "selected" state and from the "has a meal" dot below.
  dayGridItemToday: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dayGridItemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    transform: [{ scale: 1.05 }],
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  dayGridTitle: {
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  dayGridTitleActive: {
    color: "#FFF",
  },
  dayGridNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  dayGridNumberActive: {
    color: "#FFF",
  },
  // Hidden unless a meal is planned for that day — never shown for
  // selection/today alone, so it stays a single, unambiguous signal.
  dayGridDot: {
    marginTop: 1,
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: "transparent",
  },
  dayGridDotPlanned: {
    backgroundColor: colors.accent,
  },
  dayGridDotActive: {
    backgroundColor: "#FFF",
  },
});
