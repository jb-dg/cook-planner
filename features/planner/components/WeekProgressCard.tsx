import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, gradients, radii, shadows, spacing } from "../../../theme/design";

type Props = {
  weekNumber: number;
  selectedDayLabel: string;
  progress: {
    filled: number;
    total: number;
    percent: number;
  };
  onNavigate: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
};

export const WeekProgressCard = ({
  weekNumber,
  selectedDayLabel,
  progress,
  onNavigate,
  onGoToToday,
}: Props) => {
  return (
    <View style={styles.modernCard}>
      <View style={styles.modernHeader}>
        <View style={styles.modernHeaderLeft}>
          <Text style={styles.modernWeekLabel}>Semaine {weekNumber}</Text>
          <Text style={styles.modernDateLabel}>{selectedDayLabel}</Text>
        </View>
        <View style={styles.modernNavGroup}>
          <Pressable
            style={styles.modernNavButton}
            onPress={() => onNavigate("prev")}
          >
            <Feather name="chevron-left" size={16} color={colors.text} />
          </Pressable>
          <Pressable style={styles.modernTodayButton} onPress={onGoToToday}>
            <Text style={styles.modernTodayText}>Aujourd'hui</Text>
          </Pressable>
          <Pressable
            style={styles.modernNavButton}
            onPress={() => onNavigate("next")}
          >
            <Feather name="chevron-right" size={16} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <LinearGradient
          colors={gradients.statsOrange}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statValue}>{progress.percent}%</Text>
          <Text style={styles.statLabel}>Planifiés</Text>
        </LinearGradient>

        <LinearGradient
          colors={gradients.statsGreen}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statValue}>{progress.filled}</Text>
          <Text style={styles.statLabel}>Prêts</Text>
        </LinearGradient>

        <LinearGradient
          colors={gradients.statsYellow}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statValue}>
            {Math.max(progress.total - progress.filled, 0)}
          </Text>
          <Text style={styles.statLabel}>À planifier</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modernCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: spacing.base * 1.5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modernHeaderLeft: {
    gap: 2,
  },
  modernWeekLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modernDateLabel: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  modernNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.5,
  },
  modernNavButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  modernTodayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modernTodayText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
  },
});
