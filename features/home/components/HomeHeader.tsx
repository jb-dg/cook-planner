import { Text, View } from "react-native";

import { styles } from "../screens/homeScreenStyles";

type Props = {
  weekNumber: number;
  weekLabel: string;
  displayName: string;
};

export default function HomeHeader({ weekNumber, weekLabel, displayName }: Props) {
  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.headerMeta}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>Semaine {weekNumber}</Text>
        </View>
      </View>
      <Text style={styles.heading}>{weekLabel}</Text>
      <Text style={styles.subHeading}>Bonjour, {displayName}</Text>
    </View>
  );
}
