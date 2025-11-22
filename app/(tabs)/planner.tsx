import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  addDays,
  addWeeks,
  format,
  getISOWeek,
  getYear,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchHouseholdScope } from "../../lib/households";
import { colors, radii, spacing } from "../../theme/design";

type DayPlan = {
  day: string;
  lunch: { recipe: string };
  dinner: { recipe: string };
};

const DEFAULT_MENU: DayPlan[] = [
  {
    day: "Lundi",
    lunch: { recipe: "Salade césar" },
    dinner: { recipe: "Tacos de poisson" },
  },
  {
    day: "Mardi",
    lunch: { recipe: "Quiche aux poireaux" },
    dinner: { recipe: "Curry de légumes" },
  },
  {
    day: "Mercredi",
    lunch: { recipe: "Bowl de lentilles" },
    dinner: { recipe: "Soupe miso" },
  },
  {
    day: "Jeudi",
    lunch: { recipe: "Wraps houmous" },
    dinner: { recipe: "Ramen express" },
  },
  {
    day: "Vendredi",
    lunch: { recipe: "Taboulé" },
    dinner: { recipe: "Pizza veggie" },
  },
  {
    day: "Samedi",
    lunch: { recipe: "Banh mi" },
    dinner: { recipe: "Bibimbap" },
  },
  {
    day: "Dimanche",
    lunch: { recipe: "Brunch maison" },
    dinner: { recipe: "Lasagnes" },
  },
];

const normalizeDays = (value?: DayPlan[] | null) => {
  if (!value || value.length === 0) {
    return DEFAULT_MENU;
  }
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
      lunch: {
        recipe:
          (match.lunch as { recipe?: string } | null | undefined)?.recipe ??
          template.lunch.recipe,
      },
      dinner: {
        recipe:
          (match.dinner as { recipe?: string } | null | undefined)?.recipe ??
          template.dinner.recipe,
      },
    };
  });
};

export default function PlannerScreen() {
  const { session } = useAuth();
  const [referenceDate, setReferenceDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [days, setDays] = useState<DayPlan[]>(DEFAULT_MENU);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(
    {}
  );
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
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

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
  }, [session, weekNumber, year]);

  const handleDayChange = (
    index: number,
    meal: "lunch" | "dinner",
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
    setReferenceDate((current) =>
      addWeeks(current, direction === "next" ? 1 : -1)
    );
  };

  const handleToggleDay = (day: string) => {
    setCollapsedDays((prev) => ({ ...prev, [day]: !prev[day] }));
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

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headingRow}>
            <View style={styles.headingCol}>
              <Text style={styles.sectionLabel}>Planification</Text>
              <Text style={styles.heading}>Semaine {weekNumber}</Text>
              <Text style={styles.rangeText}>{weekRangeLabel}</Text>
            </View>
            <View style={styles.navAndStatus}>
              <View
                style={[
                  styles.statusPill,
                  syncing
                    ? styles.statusSync
                    : saving
                    ? styles.statusSaving
                    : styles.statusIdle,
                ]}
              >
                <Text style={styles.statusText}>
                  {syncing
                    ? "Synchronisation…"
                    : saving
                    ? "Enregistrement…"
                    : "À jour"}
                </Text>
              </View>
              <View style={styles.navRow}>
                <Pressable
                  style={styles.navButton}
                  onPress={() => handleNavigate("prev")}
                >
                  <Text style={styles.navButtonText}>◀︎</Text>
                </Pressable>
                <Pressable
                  style={styles.navButton}
                  onPress={() => handleNavigate("next")}
                >
                  <Text style={styles.navButtonText}>▶︎</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>Mois</Text>
              <TextInput editable={false} value={month} style={styles.input} />
            </View>
            <View style={styles.metaField}>
              <Text style={styles.metaLabel}>Année</Text>
              <TextInput
                editable={false}
                value={String(year)}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.quickActions}>
            <Pressable
              style={[
                styles.quickButton,
                (syncing || saving) && styles.quickButtonDisabled,
              ]}
              onPress={handleCopyPreviousWeek}
              disabled={syncing || saving}
            >
              <Text style={styles.quickButtonText}>Copier semaine -1</Text>
            </Pressable>
            <Pressable
              style={[
                styles.quickButton,
                styles.quickButtonGhost,
                (syncing || saving) && styles.quickButtonDisabled,
              ]}
              onPress={handleResetWeek}
              disabled={syncing || saving}
            >
              <Text
                style={[styles.quickButtonText, styles.quickButtonGhostText]}
              >
                Réinitialiser
              </Text>
            </Pressable>
          </View>

          {syncing ? (
            <ActivityIndicator color={colors.accentSecondary} />
          ) : syncError ? (
            <Text style={styles.errorText}>{syncError}</Text>
          ) : null}
        </View>

        {weekDays.map((item, index) => {
          const collapsed = collapsedDays[item.day];
          return (
            <View
              key={item.day}
              style={[styles.dayCard, collapsed && styles.dayCardCollapsed]}
            >
              <Pressable
                style={styles.dayHeader}
                onPress={() => handleToggleDay(item.day)}
              >
                <View>
                  <Text style={styles.day}>{item.day}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <View style={styles.dayHeaderRight}>
                  <Text
                    numberOfLines={1}
                    style={styles.previewText}
                  >{`${item.lunch.recipe} • ${item.dinner.recipe}`}</Text>
                  <Text style={styles.chevron}>{collapsed ? "▶︎" : "▼"}</Text>
                </View>
              </Pressable>

              {!collapsed && (
                <>
                  <View style={styles.mealSection}>
                    <Text style={styles.mealTitle}>Déjeuner</Text>
                    <TextInput
                      value={item.lunch.recipe}
                      onChangeText={(value) =>
                        handleDayChange(index, "lunch", value)
                      }
                      editable={!syncing && !saving}
                      placeholder="Plat du midi"
                      placeholderTextColor={colors.muted}
                      style={styles.recipeInput}
                    />
                  </View>

                  <View style={styles.mealSection}>
                    <Text style={styles.mealTitle}>Dîner</Text>
                    <TextInput
                      value={item.dinner.recipe}
                      onChangeText={(value) =>
                        handleDayChange(index, "dinner", value)
                      }
                      editable={!syncing && !saving}
                      placeholder="Plat du soir"
                      placeholderTextColor={colors.muted}
                      style={styles.recipeInput}
                    />
                  </View>
                </>
              )}
            </View>
          );
        })}

        <Pressable
          disabled={disabled}
          style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Enregistrement…" : "Enregistrer le menu"}
          </Text>
        </Pressable>
      </ScrollView>

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
    gap: 16,
    paddingBottom: 160,
  },
  headerCard: {
    padding: spacing.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headingCol: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  rangeText: {
    fontSize: 14,
    color: colors.muted,
  },
  navAndStatus: {
    alignItems: "flex-end",
    gap: 10,
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  navButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statusText: {
    color: colors.text,
    fontWeight: "600",
  },
  statusSync: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: colors.cardBorder,
  },
  statusSaving: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: colors.cardBorder,
  },
  statusIdle: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.cardBorder,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metaField: {
    flex: 1,
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  quickButton: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  quickButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  quickButtonGhost: {
    backgroundColor: "transparent",
  },
  quickButtonGhostText: {
    color: colors.muted,
  },
  quickButtonDisabled: {
    opacity: 0.6,
  },
  dayCard: {
    padding: spacing.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayCardCollapsed: {
    opacity: 0.9,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },
  date: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  dayHeaderRight: {
    alignItems: "flex-end",
    gap: 6,
    maxWidth: 180,
    flexShrink: 1,
    flexDirection: "row",
  },
  previewText: {
    color: colors.muted,
    fontSize: 12,
    flexShrink: 1,
  },
  chevron: {
    color: colors.text,
    fontSize: 16,
  },
  recipeInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    color: colors.text,
  },
  mealSection: {
    gap: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
});
