import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/design";
import { DayPlan } from "../utils/types";

type Props = {
  days: DayPlan[];
  referenceDate: Date;
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
};

export const ListView = ({
  days,
  referenceDate,
  selectedDate,
  onSelectDay,
}: Props) => {
  return (
    <View style={styles.weekList}>
      {days.map((day, dayIndex) => {
        const dayDate = addDays(referenceDate, dayIndex);
        const isActiveDay = isSameDay(dayDate, selectedDate);
        const dayAbbrev = format(dayDate, "EEE", { locale: fr })
          .replace(".", "")
          .toUpperCase();
        const dayNumber = format(dayDate, "d", { locale: fr });

        const lunchLabel = day.lunch?.recipe?.trim() || "Non planifié";
        const dinnerLabel = day.dinner?.recipe?.trim() || "Non planifié";

        return (
          <Pressable
            key={dayIndex}
            style={({ pressed }) => [
              styles.row,
              isActiveDay && styles.rowActive,
              pressed && styles.rowPressed,
            ]}
            onPress={() => onSelectDay(dayDate)}
          >
            <View
              style={[styles.dateBadge, isActiveDay && styles.dateBadgeActive]}
            >
              <Text
                style={[
                  styles.dateBadgeAbbrev,
                  isActiveDay && styles.dateBadgeTextActive,
                ]}
              >
                {dayAbbrev}
              </Text>
              <Text
                style={[
                  styles.dateBadgeNumber,
                  isActiveDay && styles.dateBadgeTextActive,
                ]}
              >
                {dayNumber}
              </Text>
            </View>

            <View style={styles.mealsColumn}>
              <View style={styles.mealLine}>
                <Text style={styles.mealLabel}>Déjeuner</Text>
                <Text
                  style={[
                    styles.mealValue,
                    !day.lunch?.recipe?.trim() && styles.mealValueEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {lunchLabel}
                </Text>
              </View>
              <View style={styles.mealLine}>
                <Text style={styles.mealLabel}>Dîner</Text>
                <Text
                  style={[
                    styles.mealValue,
                    !day.dinner?.recipe?.trim() && styles.mealValueEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {dinnerLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  weekList: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 14,
  },
  rowActive: {
    backgroundColor: colors.surfaceWarm,
  },
  rowPressed: {
    opacity: 0.85,
  },
  dateBadge: {
    width: 46,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#F4E9D9",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dateBadgeActive: {
    backgroundColor: colors.accent,
  },
  dateBadgeAbbrev: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateBadgeNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  dateBadgeTextActive: {
    color: "#FFFFFF",
  },
  mealsColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  mealLine: {
    flexDirection: "column",
    alignItems: "baseline",
    gap: 6,
  },
  mealLabel: {
    width: 70,
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mealValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  mealValueEmpty: {
    fontWeight: "500",
    color: colors.accentTertiary,
  },
});
