import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

export const useWeekNavigation = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [timeframe, setTimeframe] = useState<"current" | "next">("current");

  const referenceDate = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );

  const weekRangeLabel = useMemo(() => {
    const startLabel = format(referenceDate, "d MMM", { locale: fr });
    const endLabel = format(addDays(referenceDate, 6), "d MMM", { locale: fr });
    return `${startLabel} → ${endLabel}`;
  }, [referenceDate]);

  const selectedDayLabel = useMemo(
    () => format(selectedDate, "EEEE d MMM", { locale: fr }),
    [selectedDate]
  );

  useEffect(() => {
    setCalendarMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const baseWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (isSameWeek(selectedDate, baseWeek, { weekStartsOn: 1 })) {
      setTimeframe("current");
      return;
    }
    if (isSameWeek(selectedDate, addWeeks(baseWeek, 1), { weekStartsOn: 1 })) {
      setTimeframe("next");
      return;
    }
    setTimeframe("current");
  }, [selectedDate]);

  const handleNavigate = (direction: "prev" | "next") => {
    setSelectedDate((current) =>
      addWeeks(current, direction === "next" ? 1 : -1)
    );
  };

  const handleSelectTimeframe = (frame: "current" | "next") => {
    setTimeframe(frame);
    setSelectedDate(addWeeks(new Date(), frame === "next" ? 1 : 0));
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  return {
    selectedDate,
    setSelectedDate,
    referenceDate,
    calendarMonth,
    setCalendarMonth,
    timeframe,
    weekRangeLabel,
    selectedDayLabel,
    handleNavigate,
    handleSelectTimeframe,
    handleGoToToday,
  };
};
