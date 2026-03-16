import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { spacing } from "../../../theme/design";

const shadowActive = Platform.select({
  ios: {
    shadowColor: "#BC6C25",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 4,
    shadowColor: "#BC6C25",
  },
  default: {},
});

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
    borderWidth: 1.5,
    borderStyle: "solid",
    borderColor: "rgb(255, 255, 255)",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: spacing.base * 0.15,
    backgroundColor: "rgb(255, 255, 255)",
    gap: spacing.base * 0.15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayGridItemActive: {
    borderStyle: "solid",
    borderColor: "#BC6C25",
    backgroundColor: "#BC6C25",
    transform: [{ scale: 1.05 }],
    ...shadowActive,
  },
  dayGridTitle: {
    fontWeight: "900",
    color: "#A8A38F",
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
    fontWeight: "800",
    color: "#2D2D2A",
    textAlign: "center",
  },
  dayGridNumberActive: {
    color: "#FFF",
  },
  dayGridDot: {
    marginTop: 2,
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  dayGridDotActive: {
    backgroundColor: "#FFF",
  },
});
