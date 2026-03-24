import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
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
    <SafeAreaView style={styles.root}>
      {/* Background decorative blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Branding header ── */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Image
              source={require("../assets/images/book-icon.png")}
              style={styles.brandIconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Cook planner</Text>
        </View>

        {/* ── Marketing copy ── */}
        <View style={styles.heroSection}>
          <Text style={styles.kicker}>Installe-toi confortablement.</Text>
          <Text style={styles.heroTitle}>
            Le prochain grand repas de ta famille{" "}
            <Text style={styles.heroTitleAccent}>commence ici.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Synchronise ta cuisine sur tous tes appareils — du bureau au marché.
          </Text>
        </View>

        {/* ── Soft form card ── */}
        <View style={styles.card}>
          {/* Decorative tag */}
          <View style={styles.decorTag}>
            <Text style={styles.decorTagText}>Bienvenue !</Text>
          </View>

          <AuthForm />
        </View>

        {/* ── Security microcopy ── */}
        <View style={styles.securityRow}>
          <Feather name="lock" size={12} color="#A5A58D" />
          <Text style={styles.securityText}>
            Sécurisé comme une recette de famille
          </Text>
        </View>

        {/* ── Footer links ── */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Confidentialité</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>Conditions</Text>
          <Text style={styles.footerDot}>·</Text>
          <Text style={styles.footerText}>Aide</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FDF8F1",
    overflow: "hidden",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Background decorative blobs
  blobTopLeft: {
    position: "absolute",
    top: -60,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#DDA15E",
    opacity: 0.1,
  },
  blobBottomRight: {
    position: "absolute",
    bottom: 40,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#BC6C25",
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  // Branding
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#BC6C25",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "3deg" }],
    shadowColor: "#BC6C25",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  brandIconImage: {
    width: 30,
    height: 30,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#2D2D2A",
  },
  // Hero / marketing
  heroSection: {
    gap: 10,
    marginBottom: 28,
  },
  kicker: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#BC6C25",
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -0.5,
    color: "#2D2D2A",
  },
  heroTitleAccent: {
    color: "#DDA15E",
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B705C",
    maxWidth: 320,
  },
  // Soft card
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    padding: 24,
    shadowColor: "rgba(107, 112, 92, 0.2)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
    overflow: "hidden",
  },
  // Decorative tag
  decorTag: {
    position: "absolute",
    top: 16,
    right: -10,
    backgroundColor: "#FEFAE0",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DDA15E",
    transform: [{ rotate: "6deg" }],
    zIndex: 10,
  },
  decorTagText: {
    fontStyle: "italic",
    fontWeight: "600",
    fontSize: 13,
    color: "#BC6C25",
  },
  // Security microcopy
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A5A58D",
  },
  // Footer
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  footerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A5A58D",
  },
  footerDot: {
    color: "#A5A58D",
    fontSize: 10,
  },
});
