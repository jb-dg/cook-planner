import { View } from "react-native";
import { Text } from "@/components/Text";

import { styles } from "../screens/homeScreenStyles";

type Props = {
  weekNumber: number;
  weekLabel: string;
};

// No "Bonjour, <name>" line here — the card right below already answers
// "what's happening today" with the actual date, and a static greeting
// added a line without adding information.
export default function HomeHeader({ weekNumber, weekLabel }: Props) {
  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.headerMeta}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>Semaine {weekNumber}</Text>
        </View>
      </View>
      <Text style={styles.heading}>{weekLabel}</Text>
    </View>
  );
}
