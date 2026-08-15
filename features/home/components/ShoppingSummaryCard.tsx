import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/design";

import { styles } from "../screens/homeScreenStyles";

type Props = {
  remaining: number;
  loading: boolean;
};

export default function ShoppingSummaryCard({ remaining, loading }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.card, styles.shoppingSummaryCard]}
      onPress={() => router.push("/shopping-list")}
    >
      <View style={styles.shoppingSummaryIcon}>
        <Feather name="shopping-cart" size={20} color={colors.accent} />
      </View>
      <View style={styles.shoppingSummaryTextBlock}>
        <Text style={styles.shoppingSummaryTitle}>
          {loading
            ? "…"
            : remaining > 0
              ? `${remaining} article${remaining > 1 ? "s" : ""} à acheter`
              : "Liste de courses à jour"}
        </Text>
        <Text style={styles.shoppingSummarySubtitle}>Voir la liste →</Text>
      </View>
    </Pressable>
  );
}
