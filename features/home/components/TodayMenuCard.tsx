import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme/design";

import type { TodayMenu } from "../types";
import { styles } from "../screens/homeScreenStyles";

type Props = {
  label: string;
  menu: TodayMenu;
  loading: boolean;
  onPress: () => void;
};

// The thing a meal-planning app's home screen should answer first: "what
// am I eating today?" — previously nowhere on this screen, which only
// showed the week's overall percent-planned.
export default function TodayMenuCard({ label, menu, loading, onPress }: Props) {
  const meals: { key: "lunch" | "dinner"; label: string; icon: "sun" | "moon" }[] = [
    { key: "lunch", label: "Déjeuner", icon: "sun" },
    { key: "dinner", label: "Dîner", icon: "moon" },
  ];

  return (
    <Pressable style={[styles.card, styles.todayCard]} onPress={onPress}>
      <View style={styles.todayHeaderRow}>
        <Text style={styles.todayLabel}>Aujourd&apos;hui</Text>
        <Text style={styles.todayDate} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View style={styles.todayMealList}>
        {meals.map((meal) => {
          const recipe = menu[meal.key];
          const filled = !!recipe;
          return (
            <View key={meal.key} style={styles.todayMealRow}>
              <View style={styles.todayMealIcon}>
                <Feather
                  name={meal.icon}
                  size={16}
                  color={filled ? colors.accent : colors.accentTertiary}
                />
              </View>
              <View style={styles.todayMealTextBlock}>
                <Text style={styles.todayMealLabel}>{meal.label}</Text>
                <Text
                  style={[
                    styles.todayMealValue,
                    !filled && styles.todayMealValueEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {loading ? "…" : filled ? recipe : "Non planifié"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footerLinkText}>Voir / modifier le planning →</Text>
    </Pressable>
  );
}
