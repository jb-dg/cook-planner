import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { radii } from "../../theme/design";

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
        tabBarInactiveTintColor: "#A5A58D", // Hearth Clay
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <BlurView
            intensity={32}
            tint="light"
            style={{ flex: 1, borderRadius: radii.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[
                "rgba(253,248,241,0.92)",
                "rgba(245,239,228,0.80)",
                "rgba(253,248,241,0.72)",
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
          backgroundColor: "rgba(253,248,241,0.15)",
          borderRadius: radii.xl,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: "rgba(188,108,37,0.18)",
          height: 68,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "rgba(45,45,42,1)",
          shadowOpacity: 0.14,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 20,
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
