import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { spacing } from "../../../theme/design";
import { ViewMode } from "../utils/types";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import PhysicalIconButton from "../../../components/PhysicalIconButton";
import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";

type Props = {
  weekNumber: number;
  weekRangeLabel: string;
  viewMode: ViewMode;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date | null;
  saveError?: string | null;
  onWeekPickerOpen: () => void;
  onViewModeToggle: () => void;
};

export const PlannerHeader = ({
  weekNumber,
  weekRangeLabel,
  viewMode,
  saveStatus = "idle",
  lastSaved = null,
  saveError = null,
  onWeekPickerOpen,
  onViewModeToggle,
}: Props) => {
  return (
    <View style={styles.container}>
      {/* Top row: badge + actions */}
      <View style={styles.topRow}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>Semaine {weekNumber}</Text>
        </View>
        <View style={styles.actions}>
          {/* View toggle — physical dark button */}
          <PhysicalIconButton
            onPress={onViewModeToggle}
            active={viewMode === "list"}
            accessibilityLabel="Basculer en vue liste"
          >
            <Feather
              name={viewMode === "list" ? "grid" : "list"}
              size={18}
              color={viewMode === "list" ? "#FDF8F1" : "#2D2D2A"}
            />
          </PhysicalIconButton>
          {/* Calendar trigger */}
          <PhysicalButtonAnimated variant="secondary" onPress={onWeekPickerOpen}>
            <Text style={styles.calendarBtnText}>Changer</Text>
          </PhysicalButtonAnimated>
        </View>
      </View>

      {/* Week range heading */}
      <Pressable onPress={onWeekPickerOpen}>
        <Text style={styles.heading}>{weekRangeLabel}</Text>
      </Pressable>

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
    gap: spacing.base * 0.6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.6,
  },
  calendarBtnText: {
    color: "#6B705C",
    fontWeight: "700",
    fontSize: 13,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
});
