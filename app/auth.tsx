import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../theme/useTheme";

export default function AuthScreen() {
  const { session, initializing } = useAuth();
  const t = useTheme();

  if (initializing) {
    return (
      <View style={[styles.loader, { backgroundColor: t.colors.bg }]}>
        <Text style={{ color: t.colors.textMuted, fontWeight: "600" }}>
          Chargement…
        </Text>
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* ── Hero ── */}
      <LinearGradient
        colors={["#DDA15E", "#BC6C25", "#8B4810"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, t.shadow.md]}
      >
        {/* Badge */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Cook Planner</Text>
        </View>

        <Text style={styles.heroTitle}>Ta cuisine,{"\n"}enfin organisée</Text>
        <Text style={styles.heroSubtitle}>
          Planifie la semaine, génère ta liste de courses et retrouve tes
          recettes en un clin d'œil.
        </Text>

        {/* Decorative watermark icon */}
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </LinearGradient>

      {/* ── Form card ── */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.borderSubtle,
            borderRadius: t.radius.xl,
            padding: t.spacing.lg,
            ...t.shadow.md,
          },
        ]}
      >
        <AuthForm />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 42,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    gap: 10,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 4,
  },
  heroBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 22,
  },
  heroImage: {
    position: "absolute",
    right: -10,
    bottom: -16,
    width: 160,
    height: 160,
    opacity: 0.18,
  },
  card: {
    marginTop: -24,
    marginHorizontal: 20,
    borderWidth: 1,
  },
});
