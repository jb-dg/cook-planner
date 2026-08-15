import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, shadows } from "@/theme/design";

import type { QuickActionItem } from "./types";

type ProfileActionRowProps = Omit<QuickActionItem, "id"> & {
  // iPad split view only: highlights whichever action's content is
  // currently shown in the detail pane. Unused (and always falsy) on
  // phone, where these rows just open a modal instead of selecting.
  active?: boolean;
};

export default function ProfileActionRow({
  icon,
  label,
  helper,
  onPress,
  active,
}: ProfileActionRowProps) {
  return (
    <Pressable
      style={[styles.actionItem, active && styles.actionItemActive]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, active && styles.actionIconActive]}>
        <Feather name={icon} size={16} color={active ? "#FFFFFF" : "#BC6C25"} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>
          {label}
        </Text>
        <Text style={[styles.actionHelper, active && styles.actionHelperActive]}>
          {helper}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={active ? "rgba(255,255,255,0.85)" : "#A5A58D"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.subtle,
  },
  actionItemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(188, 108, 37, 0.3)",
    backgroundColor: "rgba(188, 108, 37, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconActive: {
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  actionContent: {
    flex: 1,
    gap: 3,
  },
  actionLabel: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 15,
  },
  actionLabelActive: {
    color: "#FFFFFF",
  },
  actionHelper: {
    fontSize: 12,
    color: colors.accentTertiary,
  },
  actionHelperActive: {
    color: "rgba(255,255,255,0.85)",
  },
});
