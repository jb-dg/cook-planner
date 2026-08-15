import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/design";

import { styles } from "../screens/homeScreenStyles";

const LINKS = [
  { href: "/planner", icon: "calendar", label: "Planning" } as const,
  { href: "/recipes", icon: "book-open", label: "Recettes" } as const,
  { href: "/shopping-list", icon: "shopping-cart", label: "Courses" } as const,
];

type Props = {
  // Tablet's narrow dashboard column stacks these instead of laying them
  // out side by side — three tiles in a row would be too cramped there.
  direction?: "row" | "column";
};

// Shortcuts to the other three tabs — the previous home screen only ever
// pointed at the planner, twice, with nothing surfacing recipes or the
// shopping list.
export default function QuickLinksRow({ direction = "row" }: Props) {
  const router = useRouter();

  return (
    <View
      style={[
        styles.quickLinksRow,
        direction === "column" && styles.quickLinksColumn,
      ]}
    >
      {LINKS.map((link) => (
        <Pressable
          key={link.href}
          style={[styles.card, styles.quickLinkTile]}
          onPress={() => router.push(link.href)}
        >
          <View style={styles.quickLinkIcon}>
            <Feather name={link.icon} size={18} color={colors.accent} />
          </View>
          <Text style={styles.quickLinkLabel}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
