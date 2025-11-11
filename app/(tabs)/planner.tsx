import { FlatList, StyleSheet, Text, View } from "react-native";

const planner = [
  { day: "Lundi", recipe: "Tacos de poisson", prep: "Préparer la marinade" },
  { day: "Mardi", recipe: "Salade césar", prep: "Cuire le poulet" },
  { day: "Mercredi", recipe: "Soupe miso", prep: "Hydrater les algues" },
  { day: "Jeudi", recipe: "Ramen express", prep: "Pré-découper les légumes" },
];

export default function PlannerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Planning de la semaine</Text>
      <FlatList
        data={planner}
        keyExtractor={(item) => item.day}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <Text style={styles.day}>{item.day}</Text>
            <Text style={styles.recipe}>{item.recipe}</Text>
            <Text style={styles.prep}>{item.prep}</Text>
          </View>
        )}
      />
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
  dayCard: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  day: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  recipe: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  prep: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
});
