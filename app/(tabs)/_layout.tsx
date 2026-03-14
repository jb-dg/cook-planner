import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radii } from "../../theme/design";

import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const { session, initializing } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom + 10, 16);
  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          <BlurView
            intensity={40}
            tint="light"
            style={{ flex: 1, borderRadius: radii.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.72)",
                "rgba(255,255,255,0.60)",
                "rgba(255,255,255,0.68)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </BlurView>
        ),
        tabBarStyle: {
          position: "absolute",
          bottom: tabBarBottom,
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
