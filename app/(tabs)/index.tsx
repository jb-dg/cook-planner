import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, getISOWeek, getYear, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchHouseholdScope } from "../../lib/households";
import { colors, radii, shadows, spacing } from "../../theme/design";

const quickActions = [
  { title: "Générer ma semaine", icon: "⚡", tone: "primary" as const },
  { title: "Ajouter un repas", icon: "+", tone: "secondary" as const },
  { title: "Voir ma liste de courses", icon: "☑︎", tone: "secondary" as const },
];

export default function HomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    []
  );
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(
    addDays(weekStart, 6),
    "d MMM",
    { locale: fr }
  )}`;
  const username = session?.user.email?.split("@")[0] ?? "Chef";
  const [planProgress, setPlanProgress] = useState({
    percent: 0,
    filled: 0,
    total: 14,
  });
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  const loadProgress = useCallback(
    async (cancelRef?: { cancelled: boolean }) => {
      if (!session) {
        setPlanProgress({ percent: 0, filled: 0, total: 14 });
        return;
      }

      setProgressLoading(true);
      setProgressError(null);
      try {
        const scope = await fetchHouseholdScope(session.user.id);
        const weekNumber = getISOWeek(weekStart);
        const month = format(weekStart, "MMMM", { locale: fr });
        const year = getYear(weekStart);

        const { data, error } = await supabase
          .from("weekly_menus")
          .select("days")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", weekNumber)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        const slots: Array<"lunch" | "dinner"> = ["lunch", "dinner"];
        const days =
          (data?.days as
            | { lunch?: { recipe?: string }; dinner?: { recipe?: string } }[]
            | undefined) ?? [];
        const total = (days.length || 7) * slots.length;
        const filled = days.reduce((acc, day) => {
          return (
            acc + slots.filter((slot) => !!day?.[slot]?.recipe?.trim()).length
          );
        }, 0);
        const percent = total
          ? Math.min(100, Math.round((filled / total) * 100))
          : 0;

        if (!cancelRef?.cancelled) {
          setPlanProgress({ percent, filled, total });
        }
      } catch (error) {
        console.error("home fetch progress", error);
        if (!cancelRef?.cancelled) {
          setProgressError("Impossible de charger le planning.");
          setPlanProgress((prev) => ({ ...prev, percent: 0 }));
        }
      } finally {
        if (!cancelRef?.cancelled) {
          setProgressLoading(false);
        }
      }
    },
    [session, weekStart]
  );

  useEffect(() => {
    let cancelled = false;
    loadProgress({ cancelled });

    return () => {
      cancelled = true;
    };
  }, [loadProgress]);

  useFocusEffect(
    useCallback(() => {
      const cancelRef = { cancelled: false };
      loadProgress(cancelRef);
      return () => {
        cancelRef.cancelled = true;
      };
    }, [loadProgress])
  );

  const missingMeals = Math.max(planProgress.total - planProgress.filled, 0);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarText}>
            <Text style={styles.metaLabel}>Cette semaine</Text>
            <Text style={styles.heading}>Bonjour {username}</Text>
          </View>
        </View>

        <Pressable
          style={styles.heroCard}
          onPress={() => router.push("/planner")}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Semaine du {weekLabel}</Text>
              <Text style={styles.heroTitle}>
                {progressLoading
                  ? "Calcul en cours…"
                  : `${planProgress.percent} % des repas planifiés`}
              </Text>
            </View>
            <Text style={styles.heroPercent}>
              {progressLoading ? "…" : `${planProgress.percent}%`}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressIndicator,
                { width: `${planProgress.percent}%` },
              ]}
            />
          </View>
          <Text style={styles.heroFoot}>
            {progressError ? progressError : `${missingMeals} repas manquants`}
          </Text>
        </Pressable>

        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.title}
              style={[
                styles.actionCard,
                action.tone === "primary"
                  ? styles.actionCardPrimary
                  : styles.actionCardSecondary,
              ]}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text
                style={[
                  styles.actionText,
                  action.tone === "primary"
                    ? styles.actionTextPrimary
                    : styles.actionTextSecondary,
                ]}
              >
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View> */}
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
    gap: spacing.base * 2,
    paddingBottom: 140,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarText: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subTitle: {
    color: colors.muted,
    fontSize: 14,
  },
  topBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  topBadgeText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
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
    color: colors.accent,
    fontWeight: "700",
    fontSize: 26,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
  },
  progressIndicator: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  heroFoot: {
    color: colors.muted,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionLink: {
    color: colors.accent,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.base,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexBasis: "48%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  actionCardPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionCardSecondary: {
    backgroundColor: colors.surfaceAlt,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.text,
  },
  actionText: {
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  actionTextPrimary: {
    color: "#fff",
  },
  actionTextSecondary: {
    color: colors.text,
  },
  suggestionRow: {
    gap: spacing.base,
    paddingVertical: 4,
  },
  suggestionCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 8,
    ...shadows.card,
  },
  suggestionImage: {
    width: "100%",
    height: 120,
    borderRadius: radii.md,
  },
  suggestionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  suggestionMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tagChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surfaceAlt,
  },
  tagChipText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
});
