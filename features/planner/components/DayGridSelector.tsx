import { addDays, format, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";
import { colors, radius, spacing } from "../../../theme/design";
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
  // Fade + slide the pills when the week changes — direction follows
  // whichever way the reference date moved (later → slide in from the
  // right, earlier → from the left). Plain pixel/opacity Animated.Values
  // (rather than a 0..1 value fed through interpolate) so a new direction
  // doesn't need a React re-render to take effect.
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const prevRefDate = useRef(referenceDate);

  useEffect(() => {
    const prev = prevRefDate.current;
    prevRefDate.current = referenceDate;
    if (prev.getTime() === referenceDate.getTime()) return;

    const direction = referenceDate.getTime() > prev.getTime() ? 1 : -1;
    opacity.setValue(0);
    translateX.setValue(direction * 28);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [referenceDate, opacity, translateX]);

  return (
    <Animated.View
      style={[styles.dayGrid, { opacity, transform: [{ translateX }] }]}
    >
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
          <View key={dayIndex} style={styles.dayGridItemWrap}>
            <PhysicalButtonAnimated
              variant={isActiveDay ? "primary" : "secondary"}
              borderRadius={radius.medium}
              onPress={() => onSelectDate(dayDate)}
              innerStyle={{
                ...styles.dayGridItemInner,
                ...(isCurrentDay && !isActiveDay ? styles.dayGridItemToday : null),
              }}
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
            </PhysicalButtonAnimated>
          </View>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dayGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    columnGap: 6,
    marginTop: spacing.base * 0.2,
    justifyContent: "space-between",
    alignContent: "center",
    alignSelf: "center",
    width: "100%",
  },
  dayGridItemWrap: {
    flex: 1,
    maxWidth: "14%",
  },
  dayGridItemInner: {
    minHeight: 46,
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 4,
  },
  // Today, when not the selected day: a subtle outline — distinct from the
  // filled "selected" state and from the "has a meal" dot below. Overrides
  // the "secondary" variant's own border, since it's merged in last.
  dayGridItemToday: {
    borderWidth: 1.5,
    borderColor: colors.accent,
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
    fontSize: 20,
    fontWeight: "800",
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
