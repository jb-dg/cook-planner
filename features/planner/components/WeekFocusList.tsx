import { Session } from "@supabase/supabase-js";
import { addDays, format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../../theme/design";
import { DayPlan, MealKey } from "../utils/types";
import { FocusView } from "./FocusView";

type Props = {
  days: DayPlan[];
  referenceDate: Date;
  session: Session | null;
  recipesLength: number;
  syncing: boolean;
  saving: boolean;
  recipesLoading: boolean;
  onDayChange: (dayIndex: number, meal: MealKey, value: string) => void;
  onOpenRecipePicker: (dayIndex: number, meal: MealKey) => void;
  onBlur: () => void;
};

// All 7 days at once, each in its own shell card with lunch/dinner side by
// side — the iPad landscape planner reads like a printed weekly menu rather
// than a single-day editor with a switcher.
export const WeekFocusList = ({
  days,
  referenceDate,
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
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(referenceDate, index);
        return {
          date,
          today: isToday(date),
          label: format(date, "EEEE d MMMM", { locale: fr }),
        };
      }),
    [referenceDate],
  );

  return (
    <View style={styles.list}>
      {dayColumns.map((day) => (
        <View key={day.date.toISOString()} style={styles.dayBlock}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderLabel}>{day.label}</Text>
            {day.today ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Aujourd&apos;hui</Text>
              </View>
            ) : null}
          </View>
          <FocusView
            days={days}
            referenceDate={referenceDate}
            selectedDate={day.date}
            session={session}
            recipesLength={recipesLength}
            syncing={syncing}
            saving={saving}
            recipesLoading={recipesLoading}
            onDayChange={onDayChange}
            onOpenRecipePicker={onOpenRecipePicker}
            onBlur={onBlur}
            layout="row"
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.base * 1.8,
  },
  dayBlock: {
    gap: spacing.base * 0.7,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayHeaderLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    textTransform: "capitalize",
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(188, 108, 37, 0.12)",
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
