import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii } from "../../theme/design";

import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const { session, initializing, needsPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const tabBarBottom = Math.max(insets.bottom + 10, 16);
  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!session || needsPasswordReset) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: isWeb ? styles.sceneWeb : undefined,
        tabBarPosition: isWeb ? "top" : "bottom",
        tabBarActiveTintColor: "#BC6C25", // Hearth Accent
        tabBarInactiveTintColor: "#6B705C", // Hearth Sage
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: isWeb ? 11 : 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        tabBarBackground: () => (
          isWeb ? (
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.72)",
                "rgba(255,255,255,0.60)",
                "rgba(255,255,255,0.68)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabBarBackground}
            />
          ) : (
            <BlurView
              intensity={40}
              tint="light"
              style={styles.tabBarBackground}
            >
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
          )
        ),
        tabBarStyle: isWeb
          ? styles.tabBarWeb
          : [styles.tabBarMobile, { bottom: tabBarBottom }],
        tabBarItemStyle: isWeb ? styles.tabBarItemWeb : undefined,
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
}

const styles = StyleSheet.create({
  sceneWeb: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
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
  tabBarWeb: {
    position: "relative",
    alignSelf: "center",
    width: "100%",
    maxWidth: 840,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.60)",
    borderRadius: 9999,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.80)",
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tabBarItemWeb: {
    paddingHorizontal: 14,
  },
});
