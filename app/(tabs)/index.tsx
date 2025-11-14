import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { colors, radii, spacing } from "../../theme/design";

const focusStats = [
  { label: "Meeting", value: "1 / 2" },
  { label: "Tâches", value: "4 / 8" },
  { label: "Objectifs", value: "4 / 5" },
];

const filters = ["Tout", "À venir", "Courses", "Batch cooking"];

const highlights = [
  {
    title: "Préparer la session batch",
    description:
      "Organise les containers, préchauffe le four et vérifie le garde-manger.",
    tag: "Focus",
    level: "Moyen",
    date: "Novembre 8, 2025",
  },
  {
    title: "Courses hebdomadaires",
    description: "Passe chez l'épicier bio pour les légumes verts et tofu.",
    tag: "Important",
    level: "Élevé",
    date: "Novembre 9, 2025",
  },
];

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          Hey, {session?.user.email?.split("@")[0] ?? "Chef"}!
        </Text>

        <LinearGradient
          colors={["#4f5dff", "#7bb8ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.focusCard}
        >
          <View style={styles.focusHeader}>
            <Text style={styles.focusTitle}>Focus du jour</Text>
            <Text style={styles.focusScore}>62%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressIndicator} />
          </View>
          {focusStats.map((stat) => (
            <View key={stat.label} style={styles.focusRow}>
              <Text style={styles.focusLabel}>{stat.label}</Text>
              <Text style={styles.focusValue}>{stat.value}</Text>
            </View>
          ))}
        </LinearGradient>

        <View style={styles.filterRow}>
          {filters.map((filter, index) => (
            <View
              key={filter}
              style={[
                styles.filterChip,
                index === 0 && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  index === 0 && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </View>
          ))}
        </View>

        {highlights.map((card) => (
          <View key={card.title} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTag}>{card.tag}</Text>
              <Text style={styles.taskLevel}>{card.level}</Text>
            </View>
            <Text style={styles.taskTitle}>{card.title}</Text>
            <Text style={styles.taskDescription}>{card.description}</Text>
            <Text style={styles.taskMeta}>{card.date}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: 18,
    paddingBottom: 120,
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  muted: {
    color: colors.muted,
  },
  focusCard: {
    borderRadius: radii.xl,
    padding: spacing.card,
    gap: 12,
    shadowColor: "#4f5dff",
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  focusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  focusTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "600",
  },
  focusScore: {
    fontSize: 44,
    fontWeight: "700",
    color: "#fff",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: radii.md,
  },
  progressIndicator: {
    width: "62%",
    height: "100%",
    borderRadius: radii.md,
    backgroundColor: "#fff",
  },
  focusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  focusLabel: {
    color: "rgba(255,255,255,0.8)",
  },
  focusValue: {
    color: "#fff",
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.surfaceAlt,
  },
  filterText: {
    color: colors.muted,
    fontWeight: "500",
  },
  filterTextActive: {
    color: colors.text,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.card,
    gap: 8,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskTag: {
    color: colors.accentSecondary,
    fontWeight: "600",
  },
  taskLevel: {
    color: colors.danger,
    fontWeight: "600",
  },
  taskTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  taskDescription: {
    color: colors.muted,
    lineHeight: 20,
  },
  taskMeta: {
    color: colors.muted,
    fontSize: 12,
  },
});
