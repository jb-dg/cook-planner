import { Tabs, Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../contexts/AuthContext";
import { colors, radii } from "../../theme/design";

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
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <BlurView
            intensity={38}
            tint="light"
            style={{ flex: 1, borderRadius: radii.xl, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.65)",
                "rgba(255,255,255,0.28)",
                "rgba(255,255,255,0.18)",
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
          backgroundColor: "rgba(255,255,255,0.12)",
          borderRadius: radii.xl,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.32)",
          height: 68,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "rgba(17, 24, 39, 0.3)",
          shadowOpacity: 0.2,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 24,
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
        name="recipes"
        options={{
          title: "Recettes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" color={color} size={size} />
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
