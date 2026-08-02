import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, shadows } from "@/theme/design";

import type { QuickActionItem } from "./types";

type ProfileActionRowProps = Omit<QuickActionItem, "id">;

export default function ProfileActionRow({
  icon,
  label,
  helper,
  onPress,
}: ProfileActionRowProps) {
  return (
    <Pressable style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Feather name={icon} size={16} color="#BC6C25" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionHelper}>{helper}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#A5A58D" />
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
  actionContent: {
    flex: 1,
    gap: 3,
  },
  actionLabel: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 15,
  },
  actionHelper: {
    fontSize: 12,
    color: colors.accentTertiary,
  },
});
