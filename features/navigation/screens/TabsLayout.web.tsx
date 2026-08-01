import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, usePathname, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { breakpoints } from "@/theme/design";

import AppTabs from "../components/AppTabs";
import { useTabsLayoutAuthState } from "../hooks/useTabsLayoutAuthState";

export default function TabsLayoutWeb() {
  const { initializing, shouldRedirectToAuth, displayName } =
    useTabsLayoutAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWideWeb = width >= breakpoints.webNavWide;

  const activeWebSection = pathname.includes("shopping-list")
    ? "shopping-list"
    : pathname.includes("recipes")
      ? "recipes"
      : pathname.includes("profile")
        ? "profile"
        : pathname.includes("planner")
          ? "planner"
          : "home";

  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (shouldRedirectToAuth) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.webRoot}>
      <View style={[styles.webNavWrap, styles.webNavWrapFixed]} pointerEvents="box-none">
        <BlurView
          intensity={45}
          tint="light"
          style={styles.webNavBlur}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              "rgba(253, 248, 241, 0.8)",
              "rgba(253, 248, 241, 0.55)",
              "rgba(253, 248, 241, 0.72)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </BlurView>
        <View style={[styles.webNav, isWideWeb && styles.webNavWide]}>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={styles.webBrand}
            accessibilityRole="button"
            accessibilityLabel="Accueil Hearth"
          >
            <View style={styles.webBrandIcon}>
              <Feather name="book-open" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.webBrandText}>Weatly</Text>
          </Pressable>

          <View
            style={[styles.webPillNav, !isWideWeb && styles.webPillNavCompact]}
          >
            <Pressable
              onPress={() => router.push("/(tabs)/planner")}
              style={styles.webPillNavLink}
            >
              <Text
                style={[
                  styles.webPillNavText,
                  activeWebSection === "planner" && styles.webPillNavTextActive,
                ]}
              >
                Planning
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/recipes")}
              style={styles.webPillNavLink}
            >
              <Text
                style={[
                  styles.webPillNavText,
                  activeWebSection === "recipes" && styles.webPillNavTextActive,
                ]}
              >
                Recettes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/shopping-list")}
              style={styles.webPillNavLink}
            >
              <Text
                style={[
                  styles.webPillNavText,
                  activeWebSection === "shopping-list" &&
                    styles.webPillNavTextActive,
                ]}
              >
                Courses
              </Text>
            </Pressable>
            {!isWideWeb && (
              <Pressable
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.webPillNavLink}
              >
                <Text
                  style={[
                    styles.webPillNavText,
                    activeWebSection === "profile" &&
                      styles.webPillNavTextActive,
                  ]}
                >
                  Profil
                </Text>
              </Pressable>
            )}
            {isWideWeb && (
              <Pressable
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.webKitchenChip}
              >
                <View style={styles.webKitchenAvatar}>
                  <Text style={styles.webKitchenAvatarText}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.webKitchenText}>
                  {`${displayName}'s Kitchen`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <View style={styles.webContent}>
        <AppTabs mode="web" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: "100%",
  },
  webNavWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.5)",
  },
  webNavWrapFixed: {
    position: "fixed" as any,
  },
  webNavBlur: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  webNav: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    flexDirection: "column",
    gap: 12,
  },
  webNavWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
  },
  webBrandIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#BC6C25",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "3deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  webBrandText: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#2D2D2A",
  },
  webPillNav: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 24,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  webPillNavCompact: {
    alignSelf: "stretch",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
  },
  webPillNavLink: {
    alignItems: "center",
    justifyContent: "center",
  },
  webPillNavText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#6B705C",
  },
  webPillNavTextActive: {
    color: "#BC6C25",
    fontWeight: "800",
  },
  webKitchenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webKitchenAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#BC6C25",
    alignItems: "center",
    justifyContent: "center",
  },
  webKitchenAvatarText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 13,
  },
  webKitchenText: {
    color: "#2D2D2A",
    fontSize: 11,
    fontWeight: "700",
  },
  webContent: {
    flex: 1,
    minHeight: 0,
    paddingBottom: 0,
    backgroundColor: "#FDF8F1",
  },
});
