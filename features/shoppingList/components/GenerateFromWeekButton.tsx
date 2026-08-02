import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radii, spacing } from "@/theme/design";

type Props = {
  loading: boolean;
  onPress: () => void;
};

export const GenerateFromWeekButton = ({ loading, onPress }: Props) => (
  <Pressable
    style={[styles.button, loading && styles.buttonDisabled]}
    onPress={onPress}
    disabled={loading}
    accessibilityRole="button"
    accessibilityLabel="Générer la liste depuis cette semaine"
  >
    {loading ? (
      <ActivityIndicator color={colors.accent} />
    ) : (
      <Feather name="refresh-cw" size={16} color={colors.accent} />
    )}
    <Text style={styles.text} numberOfLines={2}>
      {loading ? "Génération…" : "Depuis la semaine"}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.base * 0.6,
    minHeight: 48,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    flexShrink: 1,
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
});
