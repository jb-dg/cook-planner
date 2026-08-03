import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import { colors } from "@/theme/design";

type Props = {
  loading: boolean;
  onPress: () => void;
};

export const GenerateFromWeekButton = ({ loading, onPress }: Props) => (
  <PhysicalButtonAnimated
    variant="secondary"
    onPress={onPress}
    disabled={loading}
    innerStyle={styles.buttonInner}
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
  </PhysicalButtonAnimated>
);

const styles = StyleSheet.create({
  buttonInner: {
    flexDirection: "row",
    gap: 6,
  },
  text: {
    flexShrink: 1,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
});
