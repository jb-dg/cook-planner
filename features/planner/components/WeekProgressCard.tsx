import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, shadows, spacing } from "../../../theme/design";

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
            <Feather name="calendar" size={14} color={colors.accent} />
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

      <View style={styles.modernProgressContainer}>
        <View style={styles.modernProgressCircle}>
          <Text style={styles.modernProgressPercent}>{progress.percent}%</Text>
          <Text style={styles.modernProgressLabel}>planifiés</Text>
        </View>
        <View style={styles.modernProgressDetails}>
          <View style={styles.modernStatItem}>
            <View style={styles.modernStatIcon}>
              <Feather name="check-circle" size={16} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.modernStatValue}>{progress.filled}</Text>
              <Text style={styles.modernStatLabel}>repas prêts</Text>
            </View>
          </View>
          <View style={styles.modernStatDivider} />
          <View style={styles.modernStatItem}>
            <View style={styles.modernStatIcon}>
              <Feather name="clock" size={16} color={colors.muted} />
            </View>
            <View>
              <Text style={styles.modernStatValue}>
                {Math.max(progress.total - progress.filled, 0)}
              </Text>
              <Text style={styles.modernStatLabel}>à planifier</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.modernProgressBar}>
        <View
          style={[
            styles.modernProgressFill,
            { width: `${progress.percent}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modernCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.card,
    gap: spacing.base * 1.5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.soft,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  modernTodayText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  modernProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 1.5,
    paddingVertical: spacing.base,
  },
  modernProgressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  modernProgressPercent: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.accent,
  },
  modernProgressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
  },
  modernProgressDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  modernStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.75,
  },
  modernStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modernStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modernStatLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  modernStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.cardBorder,
  },
  modernProgressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  modernProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});
