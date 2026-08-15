import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme/design";
import { ViewMode } from "../utils/types";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";
import PhysicalIconButton from "../../../components/PhysicalIconButton";

type DayNav = {
  selectedDayLabel: string;
  progress: { filled: number; total: number; percent: number };
  onGoToToday: () => void;
};

type Props = {
  weekNumber: number;
  weekRangeLabel: string;
  viewMode: ViewMode;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date | null;
  saveError?: string | null;
  onWeekPickerOpen: () => void;
  onNavigateWeek: (direction: "prev" | "next") => void;
  onSetViewMode: (mode: ViewMode) => void;
  // Day card + week progress — shown inline in the header, only in day view.
  dayNav?: DayNav;
  // Hidden on iPad, where the whole week is always on screen — there's no
  // other mode to switch to.
  showViewToggle?: boolean;
};

export const PlannerHeader = ({
  weekNumber,
  weekRangeLabel,
  viewMode,
  saveStatus = "idle",
  lastSaved = null,
  saveError = null,
  onWeekPickerOpen,
  onNavigateWeek,
  onSetViewMode,
  dayNav,
  showViewToggle = true,
}: Props) => {
  const summaryText = dayNav
    ? `${dayNav.progress.filled}/${dayNav.progress.total} · ${dayNav.progress.percent}%`
    : "";

  return (
    <View style={styles.container}>
      {/* Row 1: week nav (arrows + pill) + view toggle */}
      <View style={styles.topRow}>
        <View style={styles.weekNavGroup}>
          <PhysicalIconButton
            variant="badge"
            borderRadius={12}
            onPress={() => onNavigateWeek("prev")}
            accessibilityLabel="Semaine précédente"
          >
            <Feather name="chevron-left" size={16} color="#B15E17" />
          </PhysicalIconButton>

          <PhysicalButtonAnimated
            variant="badge"
            borderRadius={16}
            onPress={onWeekPickerOpen}
            innerStyle={styles.weekBadgeInner}
            accessibilityRole="button"
            accessibilityLabel="Changer de semaine"
          >
            <Feather name="calendar" size={14} color="#B15E17" />
            <Text style={styles.weekBadgeText}>Semaine {weekNumber}</Text>
          </PhysicalButtonAnimated>

          <PhysicalIconButton
            variant="badge"
            borderRadius={12}
            onPress={() => onNavigateWeek("next")}
            accessibilityLabel="Semaine suivante"
          >
            <Feather name="chevron-right" size={16} color="#B15E17" />
          </PhysicalIconButton>
        </View>

        {/* List icon = day view, calendar icon = full-week view — matches
            the reference mock's mapping, not the "obvious" one. */}
        {showViewToggle ? (
          <View style={styles.viewToggleGroup}>
            <PhysicalIconButton
              variant="secondary"
              borderRadius={16}
              onPress={() =>
                onSetViewMode(viewMode === "focus" ? "list" : "focus")
              }
              accessibilityLabel={
                viewMode === "focus" ? "Vue semaine complète" : "Vue jour"
              }
            >
              <Feather
                name={viewMode === "focus" ? "grid" : "list"}
                size={18}
                color={colors.muted}
              />
            </PhysicalIconButton>
          </View>
        ) : null}
      </View>

      {/* Row 2: big week range title */}
      <Text style={styles.heading}>{weekRangeLabel}</Text>

      {dayNav ? (
        <>
          {/* Row 3: selected-day card + today button */}
          <View style={styles.dayCardRow}>
            <View style={styles.dayCard}>
              <Text style={styles.dayCardText} numberOfLines={1}>
                {dayNav.selectedDayLabel}
              </Text>
            </View>
            <PhysicalButtonAnimated
              variant="secondary"
              onPress={dayNav.onGoToToday}
              borderRadius={16}
              innerStyle={styles.todayButtonInner}
              accessibilityRole="button"
              accessibilityLabel="Revenir à aujourd'hui"
            >
              <Text style={styles.todayButtonText}>Aujourd&apos;hui</Text>
            </PhysicalButtonAnimated>
          </View>

          {/* Row 4: compact one-line progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${dayNav.progress.percent}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{summaryText}</Text>
          </View>
        </>
      ) : null}

      {/* Save status */}
      <SaveStatusIndicator
        status={saveStatus}
        lastSaved={lastSaved}
        error={saveError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.base * 1.1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekNavGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  weekBadgeText: {
    color: "#B15E17",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  viewToggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
    lineHeight: 33,
  },
  dayCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dayCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  dayCardText: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  todayButtonInner: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 0,
  },
  todayButtonText: {
    color: "#B15E17",
    fontWeight: "800",
    fontSize: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
});
