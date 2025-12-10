import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  getYear,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchHouseholdScope } from "../../lib/households";
import { colors, radii, spacing } from "../../theme/design";

type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

type DayPlan = {
  day: string;
  breakfast?: { recipe: string };
  lunch: { recipe: string };
  dinner: { recipe: string };
  snack?: { recipe: string };
};

const DEFAULT_MENU: DayPlan[] = [
  {
    day: "Lundi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Salade césar" },
    dinner: { recipe: "Tacos de poisson" },
    snack: { recipe: "" },
  },
  {
    day: "Mardi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Quiche aux poireaux" },
    dinner: { recipe: "Curry de légumes" },
    snack: { recipe: "" },
  },
  {
    day: "Mercredi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Bowl de lentilles" },
    dinner: { recipe: "Soupe miso" },
    snack: { recipe: "" },
  },
  {
    day: "Jeudi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Wraps houmous" },
    dinner: { recipe: "Ramen express" },
    snack: { recipe: "" },
  },
  {
    day: "Vendredi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Taboulé" },
    dinner: { recipe: "Pizza veggie" },
    snack: { recipe: "" },
  },
  {
    day: "Samedi",
    breakfast: { recipe: "" },
    lunch: { recipe: "Banh mi" },
    dinner: { recipe: "Bibimbap" },
    snack: { recipe: "" },
  },
  {
    day: "Dimanche",
    breakfast: { recipe: "" },
    lunch: { recipe: "Brunch maison" },
    dinner: { recipe: "Lasagnes" },
    snack: { recipe: "" },
  },
];

const normalizeDays = (value?: DayPlan[] | null) => {
  if (!value || value.length === 0) {
    return DEFAULT_MENU;
  }

  const ensureMeal = (
    source: { recipe?: string } | null | undefined,
    fallback: string
  ) => ({
    recipe: source?.recipe ?? fallback,
  });

  return DEFAULT_MENU.map((template) => {
    const match = value.find((item) => item.day === template.day) as
      | DayPlan
      | { day: string; recipe?: string; prep?: string }
      | undefined;

    if (!match) {
      return template;
    }

    // Support ancien format (recipe/prep) en le basculant sur le dîner pour ne rien perdre.
    if (!("lunch" in match) || !("dinner" in match)) {
      return {
        ...template,
        lunch: template.lunch,
        dinner: {
          recipe: match.recipe ?? template.dinner.recipe,
        },
      };
    }

    return {
      ...template,
      breakfast: ensureMeal(
        (match as { breakfast?: { recipe?: string } }).breakfast,
        template.breakfast?.recipe ?? ""
      ),
      lunch: ensureMeal(
        (match.lunch as { recipe?: string } | null | undefined) ?? null,
        template.lunch.recipe
      ),
      dinner: ensureMeal(
        (match.dinner as { recipe?: string } | null | undefined) ?? null,
        template.dinner.recipe
      ),
      snack: ensureMeal(
        (match as { snack?: { recipe?: string } }).snack,
        template.snack?.recipe ?? ""
      ),
    };
  });
};

export default function PlannerScreen() {
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const referenceDate = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [days, setDays] = useState<DayPlan[]>(DEFAULT_MENU);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"current" | "next">("current");
  const [weekPickerVisible, setWeekPickerVisible] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weekNumber = useMemo(() => getISOWeek(referenceDate), [referenceDate]);
  const month = useMemo(
    () => format(referenceDate, "MMMM", { locale: fr }),
    [referenceDate]
  );
  const year = useMemo(() => getYear(referenceDate), [referenceDate]);
  const weekRangeLabel = useMemo(() => {
    const startLabel = format(referenceDate, "d MMM", { locale: fr });
    const endLabel = format(addDays(referenceDate, 6), "d MMM", { locale: fr });
    return `${startLabel} → ${endLabel}`;
  }, [referenceDate]);
  const selectedDayLabel = useMemo(
    () => format(selectedDate, "EEEE d MMM", { locale: fr }),
    [selectedDate]
  );

  const calendarLabel = useMemo(
    () => format(calendarMonth, "MMMM yyyy", { locale: fr }),
    [calendarMonth]
  );

  const disabled = useMemo(() => {
    return (
      days.some(
        (item) => !item.lunch?.recipe?.trim() || !item.dinner?.recipe?.trim()
      ) ||
      !session ||
      saving ||
      syncing
    );
  }, [days, session, saving, syncing]);

  const weekDays = useMemo(
    () =>
      days.map((item, index) => ({
        ...item,
        date: format(addDays(referenceDate, index), "EEEE d MMM", {
          locale: fr,
        }),
      })),
    [days, referenceDate]
  );

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    setCalendarMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setSyncError(null);

    const loadWeek = async () => {
      try {
        const scope = await fetchHouseholdScope(session.user.id);
        const { data, error } = await supabase
          .from("weekly_menus")
          .select("days")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", weekNumber)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          throw error;
        }

        setDays(normalizeDays(data?.days as DayPlan[] | undefined));
      } catch (error) {
        if (cancelled) return;
        setSyncError("Impossible de récupérer cette semaine.");
        console.error("fetch planner", error);
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    };

    loadWeek();

    return () => {
      cancelled = true;
    };
  }, [session, weekNumber, year, month]);

  const handleDayChange = (
    index: number,
    meal: "breakfast" | "lunch" | "dinner" | "snack",
    value: string
  ) => {
    setDays((prev) => {
      const next = [...prev];
      const mealState = next[index]?.[meal] ?? { recipe: "" };
      next[index] = {
        ...next[index],
        [meal]: { ...mealState, recipe: value },
      };
      return next;
    });
  };

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

  const handleResetWeek = () => {
    setDays(DEFAULT_MENU);
    showToast("Semaine réinitialisée.", "info");
  };

  const handleCopyPreviousWeek = async () => {
    if (!session) {
      Alert.alert("Non connecté", "Connecte-toi pour copier le planning.");
      return;
    }

    setSyncing(true);
    setSyncError(null);
    try {
      const previousDate = addWeeks(referenceDate, -1);
      const scope = await fetchHouseholdScope(session.user.id);
      const prevWeekNumber = getISOWeek(previousDate);
      const prevMonth = format(previousDate, "MMMM", { locale: fr });
      const prevYear = getYear(previousDate);

      const { data, error } = await supabase
        .from("weekly_menus")
        .select("days")
        .eq(scope.filterColumn, scope.filterValue)
        .eq("year", prevYear)
        .eq("week_number", prevWeekNumber)
        .eq("month", prevMonth)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data?.days) {
        showToast("Aucun menu trouvé la semaine dernière.", "info");
        return;
      }

      setDays(normalizeDays(data.days as DayPlan[] | undefined));
      showToast("Menu copié depuis la semaine précédente.", "success");
    } catch (error) {
      console.error("copy previous week", error);
      showToast("Impossible de copier la semaine précédente.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!session) {
      Alert.alert(
        "Non connecté",
        "Connecte-toi pour enregistrer ton planning."
      );
      return;
    }

    setSaving(true);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const payload = {
        user_id: session.user.id,
        household_id: scope.householdId,
        week_number: weekNumber,
        month,
        year,
        days,
      };

      const commonFilters = { year, week_number: weekNumber, month };
      const candidateFilters = [
        { [scope.filterColumn]: scope.filterValue, ...commonFilters },
      ];
      if (scope.householdId) {
        candidateFilters.push({ user_id: session.user.id, ...commonFilters });
      }

      let existingMenu: { id: string } | null = null;
      for (const matcher of candidateFilters) {
        const { data, error } = await supabase
          .from("weekly_menus")
          .select("id")
          .match(matcher)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data?.id) {
          existingMenu = data;
          break;
        }
      }

      const mutation = existingMenu?.id
        ? supabase
            .from("weekly_menus")
            .update(payload)
            .eq("id", existingMenu.id)
        : supabase.from("weekly_menus").insert(payload);

      const { error } = await mutation;

      if (error) {
        throw error;
      }

      Alert.alert("Enregistré", "Ton menu hebdo est enregistré !");
      showToast("Menu enregistré.", "success");
    } catch (error) {
      console.error("save planner", error);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer le menu. Réessaie plus tard."
      );
      showToast("Erreur lors de l'enregistrement.", "error");
    } finally {
      setSaving(false);
    }
  };

  const mealSlots = useMemo(
    () => [
      { key: "breakfast" as MealKey, label: "Petit-déj" },
      { key: "lunch" as MealKey, label: "Déj" },
      { key: "dinner" as MealKey, label: "Dîner" },
      { key: "snack" as MealKey, label: "Snack" },
    ],
    []
  );

  const dayColumns = useMemo(
    () =>
      weekDays.map((item, index) => ({
        ...item,
        shortLabel: format(addDays(referenceDate, index), "EEE d", {
          locale: fr,
        }).replace(".", ""),
      })),
    [referenceDate, weekDays]
  );

  const progress = useMemo(() => {
    const trackedMeals: MealKey[] = ["lunch", "dinner"];
    const filled = days.reduce((acc, day) => {
      return (
        acc +
        trackedMeals.filter(
          (slot) =>
            !!(day as Record<MealKey, { recipe?: string } | undefined>)[
              slot
            ]?.recipe?.trim()
        ).length
      );
    }, 0);
    const total = days.length * trackedMeals.length || 1;
    return {
      filled,
      total,
      percent: Math.min(100, Math.round((filled / total) * 100)),
    };
  }, [days]);

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

  const visibleWeeks = useMemo(() => {
    const activeIndex = calendarWeeks.findIndex((week) =>
      week.some((day) => isSameWeek(day, selectedDate, { weekStartsOn: 1 }))
    );
    const startIndex = Math.max(0, activeIndex <= 0 ? 0 : activeIndex - 1);
    const endIndex = Math.min(calendarWeeks.length, startIndex + 3);
    return calendarWeeks.slice(startIndex, endIndex || 3);
  }, [calendarWeeks, selectedDate]);

  const miniWeeks = useMemo(() => visibleWeeks.slice(0, 2), [visibleWeeks]);

  const plannedMarkers = useMemo(() => {
    const slots: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];
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

  const weekDayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(base, index), "EEE", { locale: fr }).replace(".", "")
    );
  }, []);

  const openWeekPicker = () => {
    setWeekPickerVisible(true);
    setCalendarMonth(startOfMonth(selectedDate));
  };

  const closeWeekPicker = () => {
    setWeekPickerVisible(false);
  };

  const handleMonthNavigate = (direction: "prev" | "next") => {
    setCalendarMonth((current) =>
      addMonths(current, direction === "next" ? 1 : -1)
    );
  };

  const handleSelectFromCalendar = (date: Date) => {
    setSelectedDate(startOfWeek(date, { weekStartsOn: 1 }));
    setWeekPickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarText}>
            <Text style={styles.sectionLabel}>Planning</Text>
            <Text style={styles.heading}>Planning</Text>
            <Pressable onPress={openWeekPicker}>
              <Text style={[styles.rangeText, styles.rangeTextLink]}>
                Semaine du {weekRangeLabel}
              </Text>
            </Pressable>
          </View>
          <Pressable style={styles.topBarIcon} onPress={openWeekPicker}>
            <Feather name="calendar" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Semaine du {weekRangeLabel}</Text>
              <Text style={styles.heroTitle}>
                {progress.percent}% des repas planifiés
              </Text>
            </View>
            <Text style={styles.heroPercent}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressIndicator,
                { width: `${progress.percent}%` },
              ]}
            />
          </View>
          <Text style={styles.heroHint}>
            {Math.max(progress.total - progress.filled, 0)} repas manquants · 1
            liste de courses prête
          </Text>
        </View>

        <View style={styles.segmentCard}>
          <View style={styles.segmentRow}>
            <Pressable
              onPress={() => handleSelectTimeframe("current")}
              style={[
                styles.segmentChip,
                timeframe === "current" && styles.segmentChipActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  timeframe === "current" && styles.segmentTextActive,
                ]}
              >
                Cette semaine
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSelectTimeframe("next")}
              style={[
                styles.segmentChip,
                timeframe === "next" && styles.segmentChipActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  timeframe === "next" && styles.segmentTextActive,
                ]}
              >
                Prochaine
              </Text>
            </Pressable>
          </View>

          <View style={styles.weekMetaRow}>
            <View>
              <Text style={styles.weekTitle}>Semaine {weekNumber}</Text>
              <Text style={styles.subtleText}>{selectedDayLabel}</Text>
            </View>
            <View style={styles.weekControls}>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleNavigate("prev")}
              >
                <Feather name="chevron-left" size={18} color={colors.text} />
              </Pressable>
              <Pressable
                style={[styles.iconButton, styles.iconButtonGhost]}
                onPress={handleGoToToday}
              >
                <Text style={styles.iconButtonGhostText}>Aujourd'hui</Text>
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleNavigate("next")}
              >
                <Feather name="chevron-right" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* <View
            style={[
              styles.statusPill,
              syncing
                ? styles.statusSync
                : saving
                ? styles.statusSaving
                : styles.statusIdle,
            ]}
          >
            { <Text style={styles.statusText}>
              {syncing
                ? "Synchronisation…"
                : saving
                ? "Enregistrement…"
                : "À jour"}
            </Text> }
          </View> */}

          {/* {syncing ? (
            <ActivityIndicator color={colors.accent} />
          ) : syncError ? (
            <Text style={styles.errorText}>{syncError}</Text>
          ) : null} */}
        </View>

        <View style={styles.dayList}>
          {dayColumns.map((day, dayIndex) => {
            const dayData = days[dayIndex] || {};
            const filledCount = mealSlots.filter(
              (slot) =>
                !!(
                  (dayData as Record<MealKey, { recipe?: string }>)[slot.key]
                    ?.recipe ?? ""
                ).trim()
            ).length;
            return (
              <View key={day.day} style={styles.dayCard}>
                <View style={styles.dayCardHeader}>
                  <View>
                    <Text style={styles.dayCardDay}>{day.day}</Text>
                    <Text style={styles.dayCardDate}>{day.shortLabel}</Text>
                  </View>
                  <View
                    style={[
                      styles.dayBadge,
                      filledCount === mealSlots.length && styles.dayBadgeFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBadgeText,
                        filledCount === mealSlots.length &&
                          styles.dayBadgeTextFull,
                      ]}
                    >
                      {filledCount}/{mealSlots.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.mealList}>
                  {mealSlots.map((slot) => {
                    const meal = (
                      dayData as Record<MealKey, { recipe?: string }>
                    )[slot.key] ?? { recipe: "" };
                    const filled = !!meal.recipe?.trim();
                    return (
                      <View key={slot.key} style={styles.mealRow}>
                        <Text style={styles.mealLabel}>{slot.label}</Text>
                        <View
                          style={[
                            styles.mealInputContainer,
                            filled && styles.mealInputContainerFilled,
                          ]}
                        >
                          <TextInput
                            value={meal.recipe}
                            onChangeText={(value) =>
                              handleDayChange(dayIndex, slot.key, value)
                            }
                            editable={!syncing && !saving}
                            placeholder="Ajouter"
                            placeholderTextColor={colors.muted}
                            style={styles.mealInput}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.chipButton,
              (syncing || saving) && styles.chipButtonDisabled,
            ]}
            onPress={handleCopyPreviousWeek}
            disabled={syncing || saving}
          >
            <Text style={styles.chipButtonText}>Copier semaine précédente</Text>
          </Pressable>
          <Pressable
            style={[
              styles.chipButton,
              styles.chipButtonGhost,
              (syncing || saving) && styles.chipButtonDisabled,
            ]}
            onPress={handleResetWeek}
            disabled={syncing || saving}
          >
            <Text style={[styles.chipButtonText, styles.chipButtonGhostText]}>
              Réinitialiser
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={disabled}
          style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
          onPress={handleSave}
        >
          <Text
            style={[
              styles.saveButtonText,
              disabled && styles.saveButtonTextDisabled,
            ]}
          >
            {saving ? "Enregistrement…" : "Enregistrer le menu"}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={weekPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeWeekPicker}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeWeekPicker} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <View>
              <Text style={styles.sheetTitle}>Choisir une semaine</Text>
              <Text style={styles.sheetSubtitle}>{calendarLabel}</Text>
            </View>
            <Pressable style={styles.sheetClose} onPress={closeWeekPicker}>
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.sheetShortcutRow}>
            <Pressable
              onPress={() => {
                handleSelectTimeframe("current");
                closeWeekPicker();
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
                handleSelectTimeframe("next");
                closeWeekPicker();
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
              onPress={() => handleMonthNavigate("prev")}
            >
              <Feather name="chevron-left" size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.sheetMonthLabel}>{calendarLabel}</Text>
            <Pressable
              style={styles.sheetIconButton}
              onPress={() => handleMonthNavigate("next")}
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
            {visibleWeeks.map((week, weekIndex) => (
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

      <Pressable style={styles.fab} onPress={handleCopyPreviousWeek}>
        <Text style={styles.fabIcon}>✨</Text>
        <Text style={styles.fabText}>Auto-planifier</Text>
      </Pressable>

      {toast && (
        <View
          style={[
            styles.toast,
            toast.type === "success" && styles.toastSuccess,
            toast.type === "error" && styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: spacing.base * 2,
    paddingBottom: 200,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarText: {
    gap: 2,
  },
  topBarIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  rangeText: {
    fontSize: 15,
    color: colors.muted,
  },
  rangeTextLink: {
    color: colors.accent,
    fontWeight: "700",
  },
  subtleText: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    gap: spacing.base,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  heroPercent: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.accent,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  progressIndicator: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  heroHint: {
    color: colors.muted,
    fontSize: 13,
  },
  segmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    gap: spacing.base * 1.5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  segmentChipActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.text,
  },
  weekMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.base,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  weekControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  iconButtonGhost: {
    paddingHorizontal: 14,
    minWidth: 110,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonGhostText: {
    color: colors.accent,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    alignSelf: "flex-start",
  },
  statusText: {
    color: colors.text,
    fontWeight: "600",
  },
  statusSync: {
    backgroundColor: "rgba(255,177,92,0.12)",
    borderColor: colors.accentSecondary,
  },
  statusSaving: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  statusIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
  },
  dayList: {
    gap: spacing.base * 1.5,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.base,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCardDay: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  dayCardDate: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayBadgeFull: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  dayBadgeTextFull: {
    color: colors.background,
  },
  mealList: {
    gap: spacing.base,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  mealLabel: {
    width: 82,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  mealInputContainer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mealInputContainerFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  mealInput: {
    fontSize: 14,
    color: colors.text,
  },
  inlineCalendar: {
    marginTop: spacing.base * 1.5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.base,
  },
  inlineCalendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineCalendarTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  inlineCalendarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inlineCalendarIconButton: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inlineCalendarLabel: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  inlineCalendarWeekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inlineCalendarWeekDayText: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  inlineCalendarGrid: {
    gap: 8,
  },
  inlineCalendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  inlineCalendarDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inlineCalendarDayActiveWeek: {
    borderColor: colors.accent,
  },
  inlineCalendarDaySelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  inlineCalendarDayToday: {
    borderColor: colors.accent,
    borderWidth: 1.2,
  },
  inlineCalendarDayText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
  },
  inlineCalendarDayTextMuted: {
    color: colors.muted,
  },
  inlineCalendarDayTextSelected: {
    color: colors.background,
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    gap: spacing.base * 1.25,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gridHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.base,
  },
  gridCorner: {
    width: 70,
  },
  gridHeader: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  gridHeaderDay: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  gridHeaderDate: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing.base,
    alignItems: "center",
  },
  gridRowLabel: {
    width: 70,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  gridRowLabelText: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
  },
  gridCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    minHeight: 70,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  gridCellFilled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  gridInput: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    paddingVertical: 0,
    paddingHorizontal: 4,
    width: "100%",
    maxWidth: "100%",
    minHeight: 22,
  },
  gridTag: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gridTagText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 11,
  },
  gridMore: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.base,
    flexWrap: "wrap",
  },
  chipButton: {
    flex: 1,
    minWidth: 150,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  chipButtonGhost: {
    backgroundColor: "transparent",
  },
  chipButtonGhostText: {
    color: colors.accentSecondary,
  },
  chipButtonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: colors.muted,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    left: spacing.screen,
    right: spacing.screen,
    bottom: spacing.screen,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  toastSuccess: {
    borderColor: colors.accent,
  },
  toastError: {
    borderColor: colors.danger,
  },
  toastText: {
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
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
  fab: {
    position: "absolute",
    right: spacing.screen,
    bottom: spacing.screen,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: colors.text,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  fabIcon: {
    color: "#fff",
    fontSize: 16,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
});
