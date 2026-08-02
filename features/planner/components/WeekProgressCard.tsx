import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PhysicalIconButton from "../../../components/PhysicalIconButton";
import { colors, radius, shadows, spacing } from "../../../theme/design";

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
  const summaryText =
    progress.filled > 1
      ? `${progress.filled} repas planifiés sur ${progress.total} · ${progress.percent}%`
      : `${progress.filled} repas planifié sur ${progress.total} · ${progress.percent}%`;

  return (
    <View style={styles.softCard}>
      <View style={styles.header}>
        <PhysicalIconButton
          variant="secondary"
          onPress={() => onNavigate("prev")}
          accessibilityLabel="Semaine précédente"
        >
          <Feather name="chevron-left" size={16} color={colors.muted} />
        </PhysicalIconButton>

        <Text style={styles.dayLabel}>{selectedDayLabel}</Text>

        <PhysicalIconButton
          variant="secondary"
          onPress={() => onNavigate("next")}
          accessibilityLabel="Semaine suivante"
        >
          <Feather name="chevron-right" size={16} color={colors.muted} />
        </PhysicalIconButton>

        {/* De-emphasized on purpose: a plain link, not a heavy button */}
        <Pressable
          hitSlop={10}
          onPress={onGoToToday}
          style={styles.todayLink}
          accessibilityRole="button"
          accessibilityLabel="Revenir à aujourd'hui"
        >
          <Text style={styles.todayLinkText}>Aujourd&apos;hui</Text>
        </Pressable>
      </View>

      {/* Compact one-line summary instead of a 3-column stat block */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Résumé de la semaine</Text>
        <Text style={styles.summaryText}>{summaryText}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress.percent}%` as any },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  softCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: radius.large,
    padding: spacing.base * 1.4,
    gap: spacing.base * 0.7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    ...shadows.floating,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  todayLink: {
    marginLeft: 4,
    paddingVertical: 4,
  },
  todayLinkText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  summary: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
});
