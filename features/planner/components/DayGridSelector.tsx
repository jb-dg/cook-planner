import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: spacing.base * 0.15,
    gap: spacing.base * 0.15,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.subtle,
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
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  dayGridNumberActive: {
    color: "#FFF",
  },
  dayGridDot: {
    marginTop: 2,
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: "transparent",
  },
  dayGridDotActive: {
    backgroundColor: "#FFF",
    borderRadius: 9999,
  },
});
