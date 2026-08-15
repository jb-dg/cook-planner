import { Pressable, Text, View } from "react-native";

import type { PlanProgress } from "../types";
import { styles } from "../screens/homeScreenStyles";

type Props = {
  progress: PlanProgress;
  loading: boolean;
  error: string | null;
  missingMeals: number;
  onPress: () => void;
};

export default function WeekProgressCard({
  progress,
  loading,
  error,
  missingMeals,
  onPress,
}: Props) {
  return (
    <Pressable style={[styles.card, styles.softCard]} onPress={onPress}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressLabel}>Semaine en cours</Text>
          <Text style={styles.progressTitle}>
            {loading ? "Calcul en cours…" : `${progress.percent}% planifiés`}
          </Text>
        </View>
        <Text style={styles.progressPercent}>
          {loading ? "…" : `${progress.percent}%`}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${progress.percent}%` as any }]}
        />
      </View>

      <View style={styles.progressFooter}>
        <Text style={styles.progressFooterText}>
          {error ? error : `${missingMeals} repas manquants`}
        </Text>
        <Text style={styles.footerLinkText}>Voir le planning →</Text>
      </View>
    </Pressable>
  );
}
