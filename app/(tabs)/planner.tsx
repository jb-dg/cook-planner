import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const DEFAULT_MENU = [
  { day: "Lundi", recipe: "Tacos de poisson", prep: "Préparer la marinade" },
  { day: "Mardi", recipe: "Salade césar", prep: "Cuire le poulet" },
  { day: "Mercredi", recipe: "Soupe miso", prep: "Hydrater les algues" },
  { day: "Jeudi", recipe: "Ramen express", prep: "Pré-découper les légumes" },
  { day: "Vendredi", recipe: "Pizza veggie", prep: "Préparer la pâte" },
  { day: "Samedi", recipe: "Bibimbap", prep: "Cuire le riz" },
  { day: "Dimanche", recipe: "Brunch maison", prep: "Battre les oeufs" },
];

const getCurrentWeekNumber = () => {
  const date = new Date();
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000);
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export default function PlannerScreen() {
  const { session } = useAuth();
  const [weekNumber, setWeekNumber] = useState(String(getCurrentWeekNumber()));
  const [month, setMonth] = useState(
    new Date().toLocaleString("fr-FR", { month: "long" })
  );
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [days, setDays] = useState(DEFAULT_MENU);
  const [saving, setSaving] = useState(false);

  const disabled = useMemo(() => {
    return (
      !weekNumber.trim() ||
      !month.trim() ||
      !year.trim() ||
      days.some((item) => !item.recipe.trim()) ||
      !session
    );
  }, [weekNumber, month, year, days, session]);

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
        week_number: Number(weekNumber),
        month,
        year: Number(year),
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
      <Text style={styles.heading}>Planning de la semaine</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Semaine</Text>
          <TextInput
            keyboardType="numeric"
            value={weekNumber}
            onChangeText={setWeekNumber}
            style={styles.input}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Mois</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            style={styles.input}
          />
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Année</Text>
          <TextInput
            keyboardType="numeric"
            value={year}
            onChangeText={setYear}
            style={styles.input}
          />
        </View>
      </View>

      {days.map((item, index) => (
        <View key={item.day} style={styles.dayCard}>
          <Text style={styles.day}>{item.day}</Text>
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
        onPress={disabled || saving ? undefined : handleSave}
      >
        {saving ? "Enregistrement…" : "Enregistrer le planning"}
      </Text>
      <Text style={styles.helper}></Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metaField: {
    flex: 1,
    minWidth: 120,
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
  day: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
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
  helper: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
