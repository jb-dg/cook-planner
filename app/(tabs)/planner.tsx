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

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

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

      Alert.alert("Enregistré", "Ton menu hebdo est sauvegardé.");
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
    <ScrollView contentContainerStyle={styles.container}>
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
        <ActivityIndicator />
      ) : syncError ? (
        <Text style={styles.errorText}>{syncError}</Text>
      ) : null}

      {weekDays.map((item, index) => (
        <View key={item.day} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.day}>{item.date}</Text>
          </View>
          <TextInput
            value={item.recipe}
            onChangeText={(value) => handleDayChange(index, "recipe", value)}
            placeholder="Plat principal"
            style={styles.recipeInput}
          />
          <TextInput
            value={item.prep}
            onChangeText={(value) => handleDayChange(index, "prep", value)}
            placeholder="Préparation à anticiper"
            style={styles.prepInput}
          />
        </View>
      ))}

      <Text
        style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
        onPress={disabled ? undefined : handleSave}
      >
        {saving ? "Enregistrement…" : "Enregistrer dans Supabase"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    backgroundColor: "#111",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonText: {
    color: "#fff",
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
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dayCard: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    gap: 10,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  day: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  date: {
    fontSize: 13,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  recipeInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  prepInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#6b7280",
  },
  saveButton: {
    textAlign: "center",
    backgroundColor: "#111",
    color: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
  },
  helper: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
