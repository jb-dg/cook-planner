import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
import { colors, radii, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";

type Props = {
  visible: boolean;
  selectedDate: Date;
  referenceDate: Date;
  calendarMonth: Date;
  timeframe: "current" | "next";
  days: DayPlan[];
  sheetPaddingBottom: number;
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
  sheetPaddingBottom,
  onClose,
  onSelectTimeframe,
  onMonthNavigate,
  onSelectDate,
}: Props) => {
  const calendarLabel = useMemo(
    () => format(calendarMonth, "MMMM yyyy", { locale: fr }),
    [calendarMonth]
  );

  const weekDayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(base, index), "EEE", { locale: fr }).replace(".", "")
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
    onSelectDate(startOfWeek(date, { weekStartsOn: 1 }));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: sheetPaddingBottom }]}>
        <View style={styles.sheetHandle} />
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

        <View style={styles.sheetWeekDays}>
          {weekDayLabels.map((label) => (
            <Text key={label} style={styles.sheetWeekDayText}>
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
                      selected && styles.sheetDaySelected,
                      today && styles.sheetDayToday,
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.card,
    gap: spacing.base,
    shadowColor: "rgba(66, 58, 50, 0.25)",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
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
    width: 36,
    height: 36,
    borderRadius: 12,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  sheetMonthLabel: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: colors.text,
    textTransform: "capitalize",
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
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  sheetDayOutside: {
    backgroundColor: colors.background,
    borderColor: colors.cardBorder,
  },
  sheetDayActiveWeek: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  sheetDaySelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sheetDayToday: {
    borderColor: colors.accentSecondary,
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
