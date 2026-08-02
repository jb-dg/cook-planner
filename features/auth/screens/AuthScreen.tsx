import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "@/components/AuthForm";
import { useTheme } from "@/theme/useTheme";

import { useAuthScreenState } from "../hooks/useAuthScreenState";

export default function AuthScreen() {
  const { isInitializing, shouldRedirectToTabs } = useAuthScreenState();
  const t = useTheme();

  if (isInitializing) {
    return (
      <View style={[styles.loader, { backgroundColor: t.colors.bg }]}>
        <Text style={{ color: t.colors.textMuted, fontWeight: "600" }}>
          Chargement…
        </Text>
      </View>
    );
  }

  if (shouldRedirectToTabs) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.shell}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Image
                source={require("../../../assets/images/book-icon.png")}
                style={styles.brandIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Weatly</Text>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.kicker}>Installe-toi confortablement.</Text>
            <Text style={styles.heroTitle}>
              Le prochain grand repas de ta famille{" "}
              <Text style={styles.heroTitleAccent}>commence ici.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Synchronise ta cuisine sur tous tes appareils.
            </Text>
          </View>

          <View style={styles.cardWrap}>
            <View style={styles.card}>
              <View style={styles.decorTag}>
                <Text style={styles.decorTagText}>Bienvenue !</Text>
              </View>
              <AuthForm />
            </View>
          </View>

          <View style={styles.securityRow}>
            <Feather name="lock" size={12} color="#A5A58D" />
            <Text style={styles.securityText}>
              Sécurisé comme une recette de famille
            </Text>
          </View>
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
  blobTopLeft: {
    position: "absolute",
    top: -90,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#DDA15E",
    opacity: 0.1,
  },
  blobBottomRight: {
    position: "absolute",
    bottom: 0,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#BC6C25",
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  heroSection: {
    gap: 10,
  },
  kicker: {
    fontSize: 17,
    fontStyle: "italic",
    color: "#BC6C25",
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    letterSpacing: -0.5,
    color: "#2D2D2A",
  },
  heroTitleAccent: {
    color: "#DDA15E",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B705C",
  },
  cardWrap: {
    width: "100%",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    padding: 22,
    shadowColor: "rgba(107, 112, 92, 0.2)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
    overflow: "hidden",
  },
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
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 2,
  },
  securityText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#A5A58D",
  },
});
