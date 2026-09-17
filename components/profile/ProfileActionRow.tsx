import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";

import { colors, radii, shadows } from "@/theme/design";

import type { QuickActionItem } from "./types";

type ActionRowTone = "accent" | "muted" | "danger";

type ProfileActionRowProps = Omit<QuickActionItem, "id"> & {
  // iPad split view only: highlights whichever action's content is
  // currently shown in the detail pane. Unused (and always falsy) on
  // phone, where these rows just open a modal instead of selecting.
  active?: boolean;
  // Color language for the icon badge and, in "danger" tone, the label.
  // "accent" (default) = foyer/profil rows, "muted" = low-risk session
  // actions (déconnexion), "danger" = destructive settings.
  tone?: ActionRowTone;
  // Extra visual weight for the most severe destructive action
  // (compte) so it reads as heavier than a merely sensitive one
  // (données).
  emphasis?: boolean;
  disabled?: boolean;
};

const TONE_COLORS: Record<ActionRowTone, { icon: string; bg: string; border: string }> = {
  accent: { icon: colors.accent, bg: "rgba(188, 108, 37, 0.08)", border: "rgba(188, 108, 37, 0.3)" },
  muted: { icon: colors.muted, bg: "rgba(107, 112, 92, 0.08)", border: "rgba(107, 112, 92, 0.25)" },
  danger: { icon: colors.danger, bg: "rgba(199, 82, 82, 0.07)", border: "rgba(199, 82, 82, 0.25)" },
};

export default function ProfileActionRow({
  icon,
  label,
  helper,
  onPress,
  active,
  tone = "accent",
  emphasis = false,
  disabled = false,
}: ProfileActionRowProps) {
  const toneColors = TONE_COLORS[tone];

  return (
    <Pressable
      style={[
        styles.actionItem,
        emphasis && styles.actionItemEmphasis,
        active && styles.actionItemActive,
        disabled && styles.actionItemDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: toneColors.bg, borderColor: toneColors.border },
          emphasis && { backgroundColor: colors.danger, borderColor: colors.danger },
          active && styles.actionIconActive,
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={active ? colors.surface : emphasis ? colors.surface : toneColors.icon}
        />
      </View>
      <View style={styles.actionContent}>
        <Text
          style={[
            styles.actionLabel,
            tone === "danger" && { color: colors.danger },
            emphasis && styles.actionLabelEmphasis,
            active && styles.actionLabelActive,
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.actionHelper,
            emphasis && { color: colors.danger, opacity: 0.75 },
            active && styles.actionHelperActive,
          ]}
        >
          {helper}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={active ? "rgba(255,255,255,0.85)" : emphasis ? colors.danger : colors.accentTertiary}
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
  actionItemEmphasis: {
    backgroundColor: "rgba(199, 82, 82, 0.05)",
    borderColor: "rgba(199, 82, 82, 0.2)",
  },
  actionItemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionItemDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
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
  actionLabelEmphasis: {
    fontWeight: "800",
  },
  actionLabelActive: {
    color: colors.surface,
  },
  actionHelper: {
    fontSize: 12,
    color: colors.accentTertiary,
  },
  actionHelperActive: {
    color: "rgba(255,255,255,0.85)",
  },
});
