import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { spacing } from "../../../theme/design";
import { ViewMode } from "../utils/types";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import PhysicalIconButton from "../../../components/PhysicalIconButton";

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
          <Pressable style={styles.calendarBtn} onPress={onWeekPickerOpen}>
            <Feather name="calendar" size={18} color="#BC6C25" />
            <Text style={styles.calendarBtnText}>Changer</Text>
          </Pressable>
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
  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(165, 165, 141, 0.25)",
    shadowColor: "rgba(107, 112, 92, 0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarBtnText: {
    color: "#2D2D2A",
    fontWeight: "700",
    fontSize: 14,
  },
  heading: {
    fontSize: 30,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
});
