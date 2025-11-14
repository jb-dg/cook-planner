import { Tabs, Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../../contexts/AuthContext";
import { colors, radii } from "../../theme/design";

export default function TabsLayout() {
  const { session, initializing } = useAuth();
  const insets = useSafeAreaInsets();

  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      sceneContainerStyle={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          marginHorizontal: 32,
          backgroundColor: "#ffffff",
          borderRadius: radii.xl,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          height: 64,
          paddingBottom: 6,
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
