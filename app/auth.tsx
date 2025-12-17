import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";
import { colors, radii, shadows, spacing } from "../theme/design";

export default function AuthScreen() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Chargement…</Text>
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0f141c", "#111827", "#0f141c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Cook Planner</Text>
        </View>
        <Text style={styles.heroTitle}>Ta cuisine, enfin organisée</Text>
        <Text style={styles.heroSubtitle}>
          Planifie la semaine, génère ta liste de courses et retrouve tes recettes en un clin d'œil.
        </Text>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </LinearGradient>

      <View style={styles.card}>
        <AuthForm />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    padding: spacing.screen,
    paddingBottom: spacing.card,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: "hidden",
    gap: spacing.base,
    ...shadows.soft,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroBadgeText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
  },
  heroImage: {
    position: "absolute",
    right: -8,
    bottom: -14,
    width: 160,
    height: 160,
    opacity: 0.22,
  },
  card: {
    marginTop: -spacing.card,
    marginHorizontal: spacing.screen,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  loaderText: {
    color: colors.text,
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
