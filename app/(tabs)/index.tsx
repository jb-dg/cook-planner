import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../contexts/AuthContext";

const mockHighlights = [
  {
    title: "Déjeuner",
    recipe: "Poke bowl saumon",
  },
  {
    title: "Dîner",
    recipe: "Curry de pois chiches",
  },
];

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Bonjour {session?.user.email}</Text>
      <Text style={styles.subheading}>Ton focus du jour</Text>
      <View style={styles.cardGrid}>
        {mockHighlights.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardRecipe}>{item.recipe}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.helper}>
        Utilise les onglets « Recettes » et « Planning » pour préparer ta semaine.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
  },
  subheading: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  cardGrid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  cardRecipe: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  helper: {
    color: "#555",
  },
});
