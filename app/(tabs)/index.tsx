import { addDays, format, getISOWeek, getYear, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { fetchHouseholdScope } from "../../lib/households";
import { supabase } from "../../lib/supabase";
import { spacing } from "../../theme/design";

export default function HomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const weekNumber = getISOWeek(weekStart);
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(
    addDays(weekStart, 6),
    "d MMM",
    { locale: fr },
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
        const wn = getISOWeek(weekStart);
        const month = format(weekStart, "MMMM", { locale: fr });
        const year = getYear(weekStart);

        const { data, error } = await supabase
          .from("weekly_menus")
          .select("days")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", wn)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        const slots: ("lunch" | "dinner")[] = ["lunch", "dinner"];
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
    [session, weekStart],
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
    }, [loadProgress]),
  );

  const missingMeals = Math.max(planProgress.total - planProgress.filled, 0);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard header — mirrors HTML dashboard header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.headerMeta}>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>Semaine {weekNumber}</Text>
            </View>
          </View>
          <Text style={styles.heading}>{weekLabel}</Text>
          <Text style={styles.subHeading}>Bonjour, {username}</Text>
        </View>

        {/* Progress soft-card — mirrors the HTML's `.soft-card` */}
        <Pressable
          style={styles.softCard}
          onPress={() => router.push("/planner")}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Semaine en cours</Text>
              <Text style={styles.progressTitle}>
                {progressLoading
                  ? "Calcul en cours…"
                  : `${planProgress.percent}% planifiés`}
              </Text>
            </View>
            <Text style={styles.progressPercent}>
              {progressLoading ? "…" : `${planProgress.percent}%`}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${planProgress.percent}%` as any },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              {progressError
                ? progressError
                : `${missingMeals} repas manquants`}
            </Text>
            <Text style={styles.footerLinkText}>Voir le planning →</Text>
          </View>
        </Pressable>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{planProgress.filled}</Text>
            <Text style={styles.statLabel}>Prêts</Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                missingMeals > 0 && styles.statValueAccent,
              ]}
            >
              {missingMeals}
            </Text>
            <Text style={styles.statLabel}>À planifier</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{planProgress.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Physical CTA button — mirrors `.btn-physical` from HTML */}
        <Pressable
          style={styles.physicalCta}
          onPress={() => router.push("/planner")}
        >
          <Text style={styles.physicalCtaText}>Ouvrir mon planning</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    padding: spacing.screen,
    gap: spacing.base * 2,
    paddingBottom: 140,
  },
  dashboardHeader: {
    gap: 6,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  weekBadge: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  weekBadgeText: {
    color: "#BC6C25",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heading: {
    fontSize: 36,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subHeading: {
    fontSize: 15,
    color: "#6B705C",
    fontWeight: "500",
  },
  softCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 32,
    padding: 24,
    gap: spacing.base * 1.2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "rgba(107, 112, 92, 1)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: "#A5A58D",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressTitle: {
    color: "#2D2D2A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  progressPercent: {
    color: "#BC6C25",
    fontWeight: "900",
    fontSize: 36,
    letterSpacing: -1,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#F5EFE4",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#BC6C25",
    borderRadius: 999,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressFooterText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "500",
  },
  footerLinkText: {
    color: "#BC6C25",
    fontWeight: "700",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "rgba(107, 112, 92, 1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D2D2A",
  },
  statValueAccent: {
    color: "#BC6C25",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  physicalCta: {
    backgroundColor: "#BC6C25",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  physicalCtaText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
