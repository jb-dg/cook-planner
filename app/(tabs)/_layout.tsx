import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii } from "../../theme/design";

import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const { session, initializing, needsPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideWeb = isWeb && width >= 900;
  const tabBarBottom = Math.max(insets.bottom + 10, 16);
  const displayName = session?.user.email?.split("@")[0] ?? "Kitchen";
  const activeWebSection = pathname.includes("recipes")
    ? "recipes"
    : pathname.includes("profile")
      ? "profile"
      : pathname.includes("planner")
        ? "planner"
        : "home";
  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!session || needsPasswordReset) {
    return <Redirect href="/auth" />;
  }

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: isWeb ? styles.sceneWeb : undefined,
        tabBarPosition: "bottom",
        tabBarActiveTintColor: "#BC6C25", // Hearth Accent
        tabBarInactiveTintColor: "#6B705C", // Hearth Sage
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        tabBarBackground: () => (
          <BlurView intensity={40} tint="light" style={styles.tabBarBackground}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.72)",
                "rgba(255,255,255,0.60)",
                "rgba(255,255,255,0.68)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </BlurView>
        ),
        tabBarStyle: isWeb
          ? styles.tabBarHiddenWeb
          : [styles.tabBarMobile, { bottom: tabBarBottom }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planning",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recettes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );

  if (!isWeb) {
    return tabs;
  }

  const webNavWrapStyle = [styles.webNavWrap, isWeb && styles.webNavWrapFixed];

  return (
    <View style={styles.webRoot}>
      <View style={webNavWrapStyle} pointerEvents="box-none">
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
            {isWideWeb && (
              <>
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
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.webContent}>{tabs}</View>

    </View>
  );
}

const styles = StyleSheet.create({
  sceneWeb: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    backgroundColor: "transparent",
  },
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
  },
  webNavWrapFixed: {
    position: "fixed" as any,
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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#6B705C",
  },
  webPillNavTextActive: {
    color: "#BC6C25",
    fontWeight: "800",
  },
  webPillNavTextMuted: {
    opacity: 0.6,
  },
  webDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(165,165,141,0.3)",
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
  tabBarBackground: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  tabBarMobile: {
    position: "absolute",
    marginHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.60)",
    borderRadius: 9999,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.80)",
    height: 68,
    paddingBottom: 12,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tabBarHiddenWeb: {
    display: "none",
  },
});
