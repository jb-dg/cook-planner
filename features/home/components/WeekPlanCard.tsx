import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/design";

import type { PlanProgress, TodayMenu } from "../types";
import { styles } from "../screens/homeScreenStyles";

type Props = {
  todayLabel: string;
  todayMenu: TodayMenu;
  progress: PlanProgress;
  loading: boolean;
  error: string | null;
  missingMeals: number;
  onPressToday: () => void;
  onPressMissing: () => void;
};

// Replaces the old separate "Aujourd'hui" and "Semaine en cours" cards:
// both were really the same planning status, just split across two cards
// with two near-identical "voir le planning" links. This leads with the
// week's progress — the thing that actually needs action — then answers
// "what am I eating today" underneath. There's a single footer CTA rather
// than one per card as before: it jumps straight to the next unplanned
// slot (nested pressable, capturing the tap before it reaches the card's
// own onPress) whenever one exists, and only falls back to the generic
// "open today's planner" link once the week is fully planned.
export default function WeekPlanCard({
  todayLabel,
  todayMenu,
  progress,
  loading,
  error,
  missingMeals,
  onPressToday,
  onPressMissing,
}: Props) {
  const meals: { key: "lunch" | "dinner"; label: string; icon: "sun" | "moon" }[] = [
    { key: "lunch", label: "Déjeuner", icon: "sun" },
    { key: "dinner", label: "Dîner", icon: "moon" },
  ];

  return (
    <Pressable style={[styles.card, styles.weekPlanCard]} onPress={onPressToday}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressLabel}>Semaine en cours</Text>
          {/* The percent already has its own big number on the right —
              this line says what's left to do instead of repeating it. */}
          <Text style={styles.progressTitle}>
            {loading
              ? "Calcul en cours…"
              : error
                ? error
                : missingMeals > 0
                  ? `${missingMeals} repas manquants`
                  : "Semaine complète"}
          </Text>
        </View>
        <Text style={styles.progressPercent}>
          {loading ? "…" : `${progress.percent}%`}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${progress.percent}%` as any }]}
        />
      </View>

      <View style={styles.weekPlanDivider} />

      <View style={styles.todayHeaderRow}>
        <Text style={styles.todayLabel}>Aujourd&apos;hui</Text>
        <Text style={styles.todayDate} numberOfLines={1}>
          {todayLabel}
        </Text>
      </View>

      <View style={styles.todayMealList}>
        {meals.map((meal) => {
          const recipe = todayMenu[meal.key];
          const filled = !!recipe;
          return (
            <View key={meal.key} style={styles.todayMealRow}>
              <View style={styles.todayMealIcon}>
                <Feather
                  name={meal.icon}
                  size={16}
                  color={filled ? colors.accent : colors.accentTertiary}
                />
              </View>
              <View style={styles.todayMealTextBlock}>
                <Text style={styles.todayMealLabel}>{meal.label}</Text>
                <Text
                  style={[
                    styles.todayMealValue,
                    !filled && styles.todayMealValueEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {loading ? "…" : filled ? recipe : "Non planifié"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {!error && missingMeals > 0 ? (
        <Pressable onPress={onPressMissing}>
          <Text style={styles.footerLinkText}>Planifier le prochain repas →</Text>
        </Pressable>
      ) : (
        <Text style={styles.footerLinkText}>Voir / modifier le planning →</Text>
      )}
    </Pressable>
  );
}
