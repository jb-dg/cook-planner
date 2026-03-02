import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme/design";
import { ViewMode } from "../utils/types";
import { SaveStatusIndicator } from "./SaveStatusIndicator";

type Props = {
  weekRangeLabel: string;
  viewMode: ViewMode;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  lastSaved?: Date | null;
  saveError?: string | null;
  onWeekPickerOpen: () => void;
  onViewModeToggle: () => void;
};

export const PlannerHeader = ({
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
      <View style={styles.topBar}>
        <View style={styles.topBarText}>
          <Text style={styles.heading}>Planning</Text>
          <Pressable onPress={onWeekPickerOpen}>
            <Text style={[styles.rangeText, styles.rangeTextLink]}>
              Semaine du {weekRangeLabel}
            </Text>
          </Pressable>
        </View>
        <View style={styles.topBarActions}>
        <Pressable
          style={[
            styles.topBarIcon,
            viewMode === "list" && styles.topBarIconActive,
          ]}
          onPress={onViewModeToggle}
          accessibilityLabel="Basculer en vue liste"
        >
          <Feather
            name="list"
            size={18}
            color={viewMode === "list" ? colors.accent : colors.text}
          />
        </Pressable>
        <Pressable style={styles.topBarIcon} onPress={onWeekPickerOpen}>
          <Feather name="calendar" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>

    {/* Save Status Indicator */}
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
    gap: spacing.base * 0.5,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.5,
  },
  topBarText: {
    gap: 2,
  },
  topBarIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  topBarIconActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "15",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  rangeText: {
    fontSize: 14,
    color: colors.muted,
  },
  rangeTextLink: {
    color: colors.muted,
    fontWeight: "400",
  },
});
