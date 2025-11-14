import { useEffect, useMemo, useState } from "react";
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
import { colors, radii, spacing } from "../../theme/design";

type DayPlan = {
  day: string;
  recipe: string;
  prep: string;
};

const DEFAULT_MENU: DayPlan[] = [
  { day: "Lundi", recipe: "Tacos de poisson", prep: "Préparer la marinade" },
  { day: "Mardi", recipe: "Salade césar", prep: "Cuire le poulet" },
  { day: "Mercredi", recipe: "Soupe miso", prep: "Hydrater les algues" },
  { day: "Jeudi", recipe: "Ramen express", prep: "Pré-découper les légumes" },
  { day: "Vendredi", recipe: "Pizza veggie", prep: "Préparer la pâte" },
  { day: "Samedi", recipe: "Bibimbap", prep: "Cuire le riz" },
  { day: "Dimanche", recipe: "Brunch maison", prep: "Battre les oeufs" },
];

const normalizeDays = (value?: DayPlan[] | null) => {
  if (!value || value.length === 0) {
    return DEFAULT_MENU;
  }
  return DEFAULT_MENU.map(
    (template) => value.find((item) => item.day === template.day) ?? template
  );
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

  const weekNumber = useMemo(() => getISOWeek(referenceDate), [referenceDate]);
  const month = useMemo(
    () => format(referenceDate, "MMMM", { locale: fr }),
    [referenceDate]
  );
  const year = useMemo(() => getYear(referenceDate), [referenceDate]);

  const disabled = useMemo(() => {
    return days.some((item) => !item.recipe.trim()) || !session || saving;
  }, [days, session, saving]);

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

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setSyncError(null);

    supabase
      .from("weekly_menus")
      .select("days")
      .eq("user_id", session.user.id)
      .eq("year", year)
      .eq("week_number", weekNumber)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setSyncError("Impossible de récupérer cette semaine.");
          console.error("fetch planner", error);
          setDays(DEFAULT_MENU);
        } else {
          setDays(normalizeDays(data?.days as DayPlan[] | undefined));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session, weekNumber, year]);

  const handleDayChange = (
    index: number,
    field: "recipe" | "prep",
    value: string
  ) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleNavigate = (direction: "prev" | "next") => {
    setReferenceDate((current) =>
      addWeeks(current, direction === "next" ? 1 : -1)
    );
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
      const payload = {
        user_id: session.user.id,
        week_number: weekNumber,
        month,
        year,
        days,
      };

      const { error } = await supabase.from("weekly_menus").upsert(payload, {
        onConflict: "user_id,year,week_number",
      });

      if (error) {
        throw error;
      }

      Alert.alert("Enregistré", "Ton menu hebdo est enregistré !");
    } catch (error) {
      console.error("save planner", error);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer le menu. Réessaie plus tard."
      );
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
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Semaine {weekNumber}</Text>
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

      {syncing ? (
        <ActivityIndicator color={colors.accentSecondary} />
      ) : syncError ? (
        <Text style={styles.errorText}>{syncError}</Text>
      ) : null}

      {weekDays.map((item, index) => (
        <View key={item.day} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.day}>{item.day}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <TextInput
            value={item.recipe}
            onChangeText={(value) => handleDayChange(index, "recipe", value)}
            placeholder="Plat principal"
            placeholderTextColor={colors.muted}
            style={styles.recipeInput}
          />
          <TextInput
            value={item.prep}
            onChangeText={(value) => handleDayChange(index, "prep", value)}
            placeholder="Préparation à anticiper"
            placeholderTextColor={colors.muted}
            style={styles.prepInput}
          />
        </View>
      ))}

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
    gap: 18,
    paddingBottom: 140,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
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
  dayCard: {
    padding: spacing.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
  recipeInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    color: colors.text,
  },
  prepInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
    color: colors.text,
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
  helper: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
