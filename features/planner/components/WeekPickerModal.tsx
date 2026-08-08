import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { colors, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";

type Props = {
  visible: boolean;
  selectedDate: Date;
  referenceDate: Date;
  calendarMonth: Date;
  timeframe: "current" | "next";
  days: DayPlan[];
  onClose: () => void;
  onSelectTimeframe: (frame: "current" | "next") => void;
  onMonthNavigate: (direction: "prev" | "next") => void;
  onSelectDate: (date: Date) => void;
  setCalendarMonth: (date: Date) => void;
};

export const WeekPickerModal = ({
  visible,
  selectedDate,
  referenceDate,
  calendarMonth,
  timeframe,
  days,
  onClose,
  onSelectTimeframe,
  onMonthNavigate,
  onSelectDate,
}: Props) => {
  const calendarLabel = useMemo(() => {
    // Capitalize only the first letter — CSS `textTransform: "capitalize"`
    // would wrongly capitalize the month name too (e.g. "Août 2026").
    const raw = format(calendarMonth, "MMMM yyyy", { locale: fr });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [calendarMonth]);

  // Single-letter weekday headers (L M M J V S D), per the compact
  // calendar-picker design — de-duped visually by column position.
  const weekDayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(base, index), "EEEEE", { locale: fr }).toUpperCase()
    );
  }, []);

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const daysInterval = eachDayOfInterval({ start, end });
    const weeks: Date[][] = [];
    for (let i = 0; i < daysInterval.length; i += 7) {
      weeks.push(daysInterval.slice(i, i + 7));
    }
    return weeks;
  }, [calendarMonth]);

  const plannedMarkers = useMemo(() => {
    const slots: MealKey[] = ["lunch", "dinner"];
    const markers: Record<string, { filled: number; total: number }> = {};
    for (let index = 0; index < days.length; index++) {
      const date = addDays(referenceDate, index);
      const key = format(date, "yyyy-MM-dd");
      const filled = slots.filter((slot) =>
        (days[index] as Record<MealKey, { recipe?: string } | undefined>)[
          slot
        ]?.recipe?.trim()
      ).length;
      markers[key] = { filled, total: slots.length };
    }
    return markers;
  }, [days, referenceDate]);

  const handleSelectFromCalendar = (date: Date) => {
    // Select the tapped day itself, not its Monday — "go to this week/this
    // day" per the picker's spec, not just this week.
    onSelectDate(date);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetContainer}>
        <View style={styles.sheetHeaderRow}>
          <View>
            <Text style={styles.sheetTitle}>Choisir une semaine</Text>
            <Text style={styles.sheetSubtitle}>{calendarLabel}</Text>
          </View>
          <Pressable style={styles.sheetClose} onPress={onClose}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.sheetShortcutRow}>
          <Pressable
            onPress={() => {
              onSelectTimeframe("current");
              onClose();
            }}
            style={[
              styles.sheetChip,
              timeframe === "current" && styles.sheetChipActive,
            ]}
          >
            <Text
              style={[
                styles.sheetChipText,
                timeframe === "current" && styles.sheetChipTextActive,
              ]}
            >
              Cette semaine
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onSelectTimeframe("next");
              onClose();
            }}
            style={[
              styles.sheetChip,
              timeframe === "next" && styles.sheetChipActive,
            ]}
          >
            <Text
              style={[
                styles.sheetChipText,
                timeframe === "next" && styles.sheetChipTextActive,
              ]}
            >
              Semaine prochaine
            </Text>
          </Pressable>
        </View>

        <View style={styles.sheetMonthRow}>
          <Pressable
            style={styles.sheetIconButton}
            onPress={() => onMonthNavigate("prev")}
          >
            <Feather name="chevron-left" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.sheetMonthLabel}>{calendarLabel}</Text>
          <Pressable
            style={styles.sheetIconButton}
            onPress={() => onMonthNavigate("next")}
          >
            <Feather name="chevron-right" size={18} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetWeekDays}>
            {weekDayLabels.map((label, index) => (
              <Text key={index} style={styles.sheetWeekDayText}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.sheetGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.sheetWeekRow}>
                {week.map((date) => {
                  const inMonth = isSameMonth(date, calendarMonth);
                  const inActiveWeek = isSameWeek(date, referenceDate, {
                    weekStartsOn: 1,
                  });
                  const selected = isSameDay(date, selectedDate);
                  const today = isToday(date);
                  const marker = plannedMarkers[format(date, "yyyy-MM-dd")];
                  const hasMeals = marker?.filled;
                  const complete = marker && marker.filled >= marker.total;
                  return (
                    <Pressable
                      key={format(date, "yyyy-MM-dd")}
                      style={[
                        styles.sheetDay,
                        !inMonth && styles.sheetDayOutside,
                        inActiveWeek && styles.sheetDayActiveWeek,
                        today && !selected && styles.sheetDayToday,
                        selected && styles.sheetDaySelected,
                      ]}
                      onPress={() => handleSelectFromCalendar(date)}
                    >
                      <Text
                        style={[
                          styles.sheetDayText,
                          !inMonth && styles.sheetDayTextMuted,
                          selected && styles.sheetDayTextSelected,
                        ]}
                      >
                        {format(date, "d")}
                      </Text>
                      {hasMeals ? (
                        <View
                          style={[
                            styles.sheetDot,
                            complete && styles.sheetDotFull,
                          ]}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(45, 45, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.screen,
  },
  sheetContainer: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: spacing.base,
    shadowColor: "rgba(66, 58, 50, 0.35)",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  sheetClose: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sheetShortcutRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  sheetChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  sheetChipActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  sheetChipText: {
    color: colors.muted,
    fontWeight: "600",
  },
  sheetChipTextActive: {
    color: colors.text,
  },
  sheetMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  sheetIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  sheetMonthLabel: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: colors.text,
  },
  sheetWeekDays: {
    flexDirection: "row",
    gap: spacing.base,
    paddingHorizontal: 4,
  },
  sheetWeekDayText: {
    flex: 1,
    textAlign: "center",
    color: colors.muted,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sheetGrid: {
    gap: spacing.base,
  },
  sheetWeekRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  sheetDay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  sheetDayOutside: {},
  sheetDayActiveWeek: {
    backgroundColor: colors.surfaceAlt,
  },
  sheetDaySelected: {
    backgroundColor: colors.accent,
  },
  sheetDayToday: {
    backgroundColor: colors.surfaceWarm,
  },
  sheetDayText: {
    color: colors.text,
    fontWeight: "700",
  },
  sheetDayTextMuted: {
    color: colors.muted,
  },
  sheetDayTextSelected: {
    color: "#fff",
  },
  sheetDot: {
    marginTop: 4,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  sheetDotFull: {
    backgroundColor: colors.accent,
    opacity: 1,
    width: 10,
    height: 10,
  },
});
