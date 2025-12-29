import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchHouseholdScope } from "../../lib/households";
import { mapRecipe, Recipe } from "../../features/recipes/types";
import { colors, radii, shadows, spacing } from "../../theme/design";

type MealKey = "lunch" | "dinner";

type DayPlan = {
  day: string;
  lunch: { recipe: string };
  dinner: { recipe: string };
};

const DEFAULT_MENU: DayPlan[] = [
  {
    day: "Lundi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Mardi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Mercredi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Jeudi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Vendredi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Samedi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Dimanche",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
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
      lunch: ensureMeal(
        (match.lunch as { recipe?: string } | null | undefined) ?? null,
        template.lunch.recipe
      ),
      dinner: ensureMeal(
        (match.dinner as { recipe?: string } | null | undefined) ?? null,
        template.dinner.recipe
      ),
    };
  });
};

export default function PlannerScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [recipeQuery, setRecipeQuery] = useState("");
  const [recipePickerTarget, setRecipePickerTarget] = useState<{
    dayIndex: number;
    meal: MealKey;
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
    return !session || saving || syncing;
  }, [session, saving, syncing]);

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

  const openRecipePicker = (dayIndex: number, meal: MealKey) => {
    setRecipePickerTarget({ dayIndex, meal });
    setRecipeQuery("");
  };

  const closeRecipePicker = () => {
    setRecipePickerTarget(null);
    setRecipeQuery("");
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!recipePickerTarget) return;
    handleDayChange(
      recipePickerTarget.dayIndex,
      recipePickerTarget.meal,
      recipe.title
    );
    closeRecipePicker();
    showToast("Recette ajoutée au planning.", "success");
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

  useEffect(() => {
    if (!session) {
      setRecipes([]);
      setRecipesError(null);
      setRecipesLoading(false);
      return;
    }

    let cancelled = false;
    const loadRecipes = async () => {
      setRecipesLoading(true);
      setRecipesError(null);
      try {
        const scope = await fetchHouseholdScope(session.user.id);
        const { data, error } = await supabase
          .from("recipes")
          .select("id,title,duration,difficulty,servings,description")
          .eq(scope.filterColumn, scope.filterValue)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setRecipes((data ?? []).map(mapRecipe));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("fetch recipes planner", error);
        setRecipesError("Impossible de charger tes recettes.");
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    };

    loadRecipes();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const handleDayChange = (index: number, meal: MealKey, value: string) => {
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
      const sanitizedDays = days.map((day) => {
        const sanitize = (value?: { recipe?: string }) => ({
          recipe: value?.recipe?.trim() ?? "",
        });
        return {
          ...day,
          lunch: sanitize((day as DayPlan).lunch),
          dinner: sanitize((day as DayPlan).dinner),
        };
      });
      const payload = {
        user_id: session.user.id,
        household_id: scope.householdId,
        week_number: weekNumber,
        month,
        year,
        days: sanitizedDays,
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
      { key: "lunch" as MealKey, label: "Déj" },
      { key: "dinner" as MealKey, label: "Dîner" },
    ],
    []
  );

  const recipePickerContext = useMemo(() => {
    if (!recipePickerTarget) return null;
    const day = weekDays[recipePickerTarget.dayIndex];
    const mealLabel =
      mealSlots.find((slot) => slot.key === recipePickerTarget.meal)?.label ??
      "";
    return {
      dayLabel: day?.day ?? "Jour",
      dateLabel: (day as { date?: string })?.date ?? "",
      mealLabel,
    };
  }, [recipePickerTarget, weekDays, mealSlots]);

  const recipePickerValue = useMemo(() => {
    if (!recipePickerTarget) return "";
    const day = days[recipePickerTarget.dayIndex];
    const meal = (day as Record<MealKey, { recipe?: string }> | undefined)?.[
      recipePickerTarget.meal
    ];
    return meal?.recipe ?? "";
  }, [recipePickerTarget, days]);

  const filteredRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(query)
    );
  }, [recipes, recipeQuery]);

  const dayColumns = useMemo(
    () =>
      weekDays.map((item, index) => ({
        ...item,
        shortLabel: format(addDays(referenceDate, index), "EEE d MMM", {
          locale: fr,
        }).replace(".", ""),
      })),
    [referenceDate, weekDays]
  );

  const selectedDayIndex = useMemo(() => {
    const index = dayColumns.findIndex((_, dayIndex) =>
      isSameDay(addDays(referenceDate, dayIndex), selectedDate)
    );
    return index >= 0 ? index : 0;
  }, [dayColumns, referenceDate, selectedDate]);

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

  const visibleWeeks = useMemo(() => calendarWeeks, [calendarWeeks]);

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

  const weekDayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(base, index), "EEE", { locale: fr }).replace(".", "")
    );
  }, []);

  const sheetPaddingBottom = useMemo(
    () => spacing.card + Math.max(insets.bottom, 12),
    [insets.bottom]
  );

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
        contentContainerStyle={[
          styles.container,
          { paddingBottom: spacing.screen + insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarText}>
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
            {Math.max(progress.total - progress.filled, 0)} repas manquants
          </Text>
        </View>

        <View style={styles.segmentCard}>
          {/* <View style={styles.segmentRow}>
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
          </View> */}

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
        </View>

        <View style={styles.dayGrid}>
          {dayColumns.map((day, dayIndex) => {
            const dayDate = addDays(referenceDate, dayIndex);
            const isActiveDay = isSameDay(dayDate, selectedDate);
            const dayNumber = format(dayDate, "d", { locale: fr });
            const dayAbbrev = format(dayDate, "EEE", { locale: fr })
              .replace(".", "")
              .toUpperCase();
            return (
              <Pressable
                key={day.day}
                style={[
                  styles.dayGridItem,
                  isActiveDay && styles.dayGridItemActive,
                ]}
                onPress={() => setSelectedDate(dayDate)}
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

        <View style={styles.dayList}>
          {(() => {
            const day = dayColumns[selectedDayIndex];
            const dayData = days[selectedDayIndex] || {};
            const filledCount = mealSlots.filter(
              (slot) =>
                !!(
                  (dayData as Record<MealKey, { recipe?: string }>)[slot.key]
                    ?.recipe ?? ""
                ).trim()
            ).length;
            const missingMeals = Math.max(mealSlots.length - filledCount, 0);
            const dayStatusLabel =
              missingMeals === 0 ? "Complet" : `${missingMeals} à planifier`;
            const dayStatusIcon: ComponentProps<typeof Feather>["name"] =
              missingMeals === 0 ? "check" : "alert-circle";
            return (
              <View
                key={day.day}
                style={[styles.dayCard, styles.dayCardActive]}
              >
                <View style={styles.dayCardHeader}>
                  <View style={styles.dayCardHeaderLeft}>
                    <View style={styles.dayAvatar}>
                      <Text style={styles.dayAvatarText}>
                        {day.day.slice(0, 1)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.dayCardDay}>{day.day}</Text>
                      <Text
                        style={[styles.dayCardDate, styles.dayCardDateActive]}
                      >
                        {day.shortLabel}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.dayStatusPill,
                      missingMeals === 0
                        ? styles.dayStatusPillComplete
                        : styles.dayStatusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayStatusText,
                        missingMeals === 0 && styles.dayStatusTextComplete,
                      ]}
                    >
                      {dayStatusLabel}
                    </Text>
                    <Feather
                      name={dayStatusIcon}
                      size={14}
                      color={
                        missingMeals === 0 ? colors.background : colors.text
                      }
                    />
                  </View>
                </View>

                <View style={styles.dayProgressRow}>
                  <Text style={styles.dayProgressLabel}>
                    {filledCount}/{mealSlots.length} repas prêts
                  </Text>
                  <View style={styles.dayProgressBar}>
                    <View
                      style={[
                        styles.dayProgressIndicator,
                        {
                          width: `${Math.min(
                            100,
                            (filledCount / mealSlots.length) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.mealList}>
                  {mealSlots.map((slot) => {
                    const meal = (
                      dayData as Record<MealKey, { recipe?: string }>
                    )[slot.key] ?? { recipe: "" };
                    const filled = !!meal.recipe?.trim();
                    const mealIcon: ComponentProps<typeof Feather>["name"] =
                      slot.key === "lunch" ? "sun" : "moon";
                    const statusText = filled
                      ? "Recette ajoutée"
                      : "À planifier";
                    const hint =
                      !session && !recipes.length
                        ? "Saisie libre ou ajoute tes recettes en te connectant"
                        : "Saisie libre ou recette enregistrée";
                    return (
                      <View key={slot.key} style={styles.mealRow}>
                        <View
                          style={[
                            styles.mealCard,
                            filled && styles.mealCardFilled,
                          ]}
                        >
                          <View style={styles.mealCardHeader}>
                            <View style={styles.mealLabelRow}>
                              <View
                                style={[
                                  styles.mealIcon,
                                  filled && styles.mealIconFilled,
                                ]}
                              >
                                <Feather
                                  name={mealIcon}
                                  size={14}
                                  color={
                                    filled ? colors.background : colors.text
                                  }
                                />
                              </View>
                              <View style={styles.mealLabelColumn}>
                                <Text style={styles.mealLabel}>
                                  {slot.label}
                                </Text>
                                <Text style={styles.mealStatusText}>
                                  {statusText}
                                </Text>
                              </View>
                            </View>
                            <Pressable
                              style={[
                                styles.recipeButton,
                                (!session || recipesLoading) &&
                                  styles.recipeButtonDisabled,
                              ]}
                              hitSlop={10}
                              onPress={() =>
                                openRecipePicker(selectedDayIndex, slot.key)
                              }
                              disabled={recipesLoading}
                            >
                              <Feather
                                name="book-open"
                                size={16}
                                color={colors.accent}
                              />
                            </Pressable>
                          </View>
                          <View
                            style={[
                              styles.mealInputContainer,
                              filled && styles.mealInputContainerFilled,
                            ]}
                          >
                            <TextInput
                              value={meal.recipe}
                              onChangeText={(value) =>
                                handleDayChange(
                                  selectedDayIndex,
                                  slot.key,
                                  value
                                )
                              }
                              editable={!syncing && !saving}
                              placeholder="Recette ou note libre"
                              placeholderTextColor={colors.muted}
                              style={styles.mealInput}
                            />
                            <Text style={styles.mealHint}>{hint}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {((dayData as DayPlan).notes ?? "").trim() ? (
                  <View style={styles.dayNote}>
                    <Text style={styles.dayNoteLabel}>Note</Text>
                    <Text style={styles.dayNoteText}>
                      {(dayData as DayPlan).notes}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })()}
        </View>

        {/* <View style={styles.actionRow}>
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
        </View> */}

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
        <View
          style={[styles.sheetContainer, { paddingBottom: sheetPaddingBottom }]}
        >
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

      <Modal
        visible={!!recipePickerTarget}
        transparent
        animationType="slide"
        onRequestClose={closeRecipePicker}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeRecipePicker} />
        <View
          style={[
            styles.sheetContainer,
            styles.recipeSheet,
            { paddingBottom: sheetPaddingBottom },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetTitleGroup}>
              <Text style={styles.sheetTitle}>Ajouter un repas</Text>
              <Text style={styles.sheetSubtitle}>
                {recipePickerContext
                  ? `${recipePickerContext.mealLabel} · ${recipePickerContext.dayLabel}`
                  : "Choisis une option"}
              </Text>
              {recipePickerContext?.dateLabel ? (
                <Text style={styles.sheetSubtle}>
                  {recipePickerContext.dateLabel}
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.sheetClose} onPress={closeRecipePicker}>
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.freeEntryCard}>
            <Text style={styles.sheetSectionLabel}>Entrée libre</Text>
            <TextInput
              value={recipePickerValue}
              onChangeText={(value) => {
                if (!recipePickerTarget) return;
                handleDayChange(
                  recipePickerTarget.dayIndex,
                  recipePickerTarget.meal,
                  value
                );
              }}
              placeholder="Ajouter un repas personnalisé"
              placeholderTextColor={colors.muted}
              style={styles.freeEntryInput}
            />
            <Text style={styles.freeEntryHint}>
              Tape ton idée, elle sera enregistrée pour ce repas.
            </Text>
          </View>

          <View style={styles.sheetSectionHeader}>
            <Text style={styles.sheetSectionLabel}>Ou choisis une recette</Text>
            <View style={styles.sheetSearch}>
              <Feather name="search" size={14} color={colors.muted} />
              <TextInput
                placeholder="Rechercher dans ta bibliothèque"
                placeholderTextColor={colors.muted}
                style={styles.sheetSearchInput}
                value={recipeQuery}
                onChangeText={setRecipeQuery}
              />
            </View>
          </View>

          {recipesError ? (
            <Text style={styles.sheetErrorText}>{recipesError}</Text>
          ) : null}

          {recipesLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : !session ? (
            <View style={styles.sheetEmptyState}>
              <Text style={styles.sheetEmptyText}>
                Connecte-toi pour parcourir tes recettes.
              </Text>
            </View>
          ) : filteredRecipes.length ? (
            <ScrollView
              style={styles.recipeList}
              contentContainerStyle={styles.recipeListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredRecipes.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [
                    styles.recipeOption,
                    pressed && styles.recipeOptionPressed,
                  ]}
                  onPress={() => handleSelectRecipe(recipe)}
                >
                  <View style={styles.recipeOptionHeader}>
                    <Text style={styles.recipeOptionTitle}>{recipe.title}</Text>
                    <View style={styles.recipeOptionBadges}>
                      {recipe.duration ? (
                        <Text style={styles.recipeBadge}>
                          {recipe.duration}
                        </Text>
                      ) : null}
                      <Text style={styles.recipeBadge}>
                        {recipe.servings} pers.
                      </Text>
                    </View>
                  </View>
                  {recipe.description ? (
                    <Text style={styles.recipeOptionDescription}>
                      {recipe.description}
                    </Text>
                  ) : null}
                  <Text style={styles.recipeOptionAction}>
                    Utiliser pour ce repas
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.sheetEmptyState}>
              <Text style={styles.sheetEmptyText}>
                Aucune recette trouvée avec ce filtre.
              </Text>
              <Text style={styles.sheetEmptySubtext}>
                Essaie un autre mot-clé ou ajoute une nouvelle recette.
              </Text>
            </View>
          )}
        </View>
      </Modal>

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
    paddingBottom: spacing.screen * 2,
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
    ...shadows.soft,
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
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.base * 0.5,
    columnGap: spacing.base * 0.5,
    rowGap: spacing.base * 0.5,
    marginTop: spacing.base * 0.5,
    justifyContent: "flex-start",
    alignContent: "center",
    alignSelf: "center",
    width: "100%",
  },
  dayGridItem: {
    flexBasis: "23%",
    maxWidth: "23%",
    minWidth: 82,
    minHeight: 96,
    borderWidth: 1.1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    paddingVertical: spacing.base * 0.8,
    paddingHorizontal: spacing.base * 0.8,
    backgroundColor: colors.surface,
    gap: spacing.base * 0.4,
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
  },
  dayGridTitleActive: {
    color: colors.background,
  },
  dayGridNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  dayGridNumberActive: {
    color: colors.background,
  },
  dayGridDot: {
    marginTop: 4,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  dayGridDotActive: {
    backgroundColor: colors.background,
  },
  dayList: {
    gap: spacing.base * 1.5,
    alignItems: "center",
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.base,
    ...shadows.card,
    width: "100%",
    maxWidth: 720,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayAvatarText: {
    fontWeight: "700",
    color: colors.text,
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
  dayStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
  },
  dayStatusPillComplete: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayStatusPillPending: {
    backgroundColor: colors.surfaceAlt,
  },
  dayStatusText: {
    fontWeight: "700",
    color: colors.text,
  },
  dayStatusTextComplete: {
    color: colors.background,
  },
  dayProgressRow: {
    gap: 8,
  },
  dayProgressLabel: {
    color: colors.muted,
    fontWeight: "600",
  },
  dayProgressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  dayProgressIndicator: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  mealList: {
    gap: spacing.base * 1.1,
  },
  mealRow: {
    gap: spacing.base * 0.75,
    width: "100%",
  },
  mealLabelColumn: {
    flex: 1,
    gap: 4,
  },
  mealLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  mealStatusText: {
    color: colors.muted,
    fontSize: 12,
  },
  mealHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  mealCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.base,
    gap: 8,
    width: "100%",
  },
  mealCardFilled: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  mealCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.base,
  },
  mealLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    flex: 1,
  },
  mealIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mealIconFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  recipeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  recipeButtonDisabled: {
    opacity: 0.6,
  },
  mealInputContainer: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  mealInputContainerFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  mealInput: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
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
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.cardBorder,
  },
  chipButtonGhostText: {
    color: colors.text,
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
    ...shadows.card,
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
    shadowColor: "rgba(66, 58, 50, 0.25)",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  recipeSheet: {
    maxHeight: "82%",
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
  sheetTitleGroup: {
    flex: 1,
    gap: 2,
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
  sheetSubtle: {
    color: colors.muted,
    fontSize: 12,
  },
  sheetSectionLabel: {
    fontWeight: "700",
    color: colors.text,
  },
  sheetSectionHeader: {
    gap: 8,
    marginTop: spacing.base,
  },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
  },
  sheetSearchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: 10,
  },
  sheetErrorText: {
    color: colors.danger,
    marginTop: 4,
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
  freeEntryCard: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  freeEntryInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  freeEntryHint: {
    color: colors.muted,
    fontSize: 12,
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
  recipeList: {
    marginTop: spacing.base,
  },
  recipeListContent: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  recipeOption: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.card,
    gap: 6,
  },
  recipeOptionPressed: {
    opacity: 0.92,
  },
  recipeOptionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  recipeOptionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  recipeOptionBadges: {
    flexDirection: "row",
    gap: 6,
  },
  recipeBadge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  recipeOptionDescription: {
    color: colors.muted,
  },
  recipeOptionAction: {
    marginTop: 6,
    color: colors.accent,
    fontWeight: "700",
  },
  sheetEmptyState: {
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
    alignItems: "center",
  },
  sheetEmptyText: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetEmptySubtext: {
    color: colors.muted,
    textAlign: "center",
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
    ...shadows.soft,
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
