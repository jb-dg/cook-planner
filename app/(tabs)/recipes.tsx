import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii, spacing } from "../../theme/design";

type Recipe = {
  id: string;
  title: string;
  duration: string;
  difficulty: "Facile" | "Moyen" | "Expert";
};

const recipes: Recipe[] = [
  { id: "1", title: "Pad Thaï aux crevettes", duration: "25 min", difficulty: "Moyen" },
  { id: "2", title: "Soupe thaï veggie", duration: "30 min", difficulty: "Facile" },
  { id: "3", title: "Banh mi croustillant", duration: "40 min", difficulty: "Expert" },
];

export default function RecipesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.container}>
      <Text style={styles.heading}>Bibliothèque de recettes</Text>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <Text style={styles.difficulty}>{item.difficulty}</Text>
            </View>
            <Text style={styles.muted}>{item.duration}</Text>
          </View>
        )}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.screen,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  recipeCard: {
    padding: spacing.card,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  muted: {
    color: colors.muted,
    marginTop: 8,
  },
});
