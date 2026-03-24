import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing } from "../../../theme/design";

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
  selectedDayLabel,
  progress,
  onNavigate,
  onGoToToday,
}: Props) => {
  const missing = Math.max(progress.total - progress.filled, 0);

  return (
    <View style={styles.softCard}>
      <View style={styles.header}>
        <Text style={styles.dayLabel}>{selectedDayLabel}</Text>
        <View style={styles.navGroup}>
          <Pressable style={styles.navBtn} onPress={() => onNavigate("prev")}>
            <Feather name="chevron-left" size={16} color="#2D2D2A" />
          </Pressable>
          <Pressable style={styles.todayBtn} onPress={onGoToToday}>
            <Text style={styles.todayText}>Aujourd&apos;hui</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => onNavigate("next")}>
            <Feather name="chevron-right" size={16} color="#2D2D2A" />
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress.percent}%` as any },
          ]}
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.percent}%</Text>
          <Text style={styles.statLabel}>Planifiés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.filled}</Text>
          <Text style={styles.statLabel}>Prêts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[styles.statValue, missing > 0 && styles.statValueMissing]}
          >
            {missing}
          </Text>
          <Text style={styles.statLabel}>À planifier</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  softCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 28,
    padding: 20,
    gap: spacing.base * 1.2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#6B705C",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2D2A",
    textTransform: "capitalize",
  },
  navGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5EFE4",
  },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#BC6C25",
    shadowColor: "#BC6C25",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  todayText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E4D9C8",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D2D2A",
  },
  statValueMissing: {
    color: "#BC6C25",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
