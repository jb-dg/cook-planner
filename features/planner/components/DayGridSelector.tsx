import { Pressable, StyleSheet, Text, View } from "react-native";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { colors, shadows, spacing } from "../../../theme/design";

type Props = {
  referenceDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export const DayGridSelector = ({
  referenceDate,
  selectedDate,
  onSelectDate,
}: Props) => {
  return (
    <View style={styles.dayGrid}>
      {Array.from({ length: 7 }).map((_, dayIndex) => {
        const dayDate = addDays(referenceDate, dayIndex);
        const isActiveDay = isSameDay(dayDate, selectedDate);
        const dayNumber = format(dayDate, "d", { locale: fr });
        const dayAbbrev = format(dayDate, "EEE", { locale: fr })
          .replace(".", "")
          .toUpperCase();

        return (
          <Pressable
            key={dayIndex}
            style={[
              styles.dayGridItem,
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
            <View
              style={[
                styles.dayGridDot,
                isActiveDay && styles.dayGridDotActive,
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
    marginTop: spacing.base * 0.5,
    justifyContent: "space-between",
    alignContent: "center",
    alignSelf: "center",
    width: "100%",
  },
  dayGridItem: {
    flex: 1,
    minHeight: 60,
    maxWidth: "14%",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingVertical: spacing.base * 0.25,
    paddingHorizontal: spacing.base * 0.15,
    backgroundColor: colors.surface,
    gap: spacing.base * 0.15,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
  },
  dayGridItemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    shadowColor: "rgba(217, 119, 87, 0.32)",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  dayGridTitle: {
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    textAlign: "center",
    fontSize: 10,
  },
  dayGridTitleActive: {
    color: colors.background,
  },
  dayGridNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  dayGridNumberActive: {
    color: colors.background,
  },
  dayGridDot: {
    marginTop: 2,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  dayGridDotActive: {
    backgroundColor: colors.background,
  },
});
