import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

type AppTabsProps = {
  tabBarBottomInset?: number;
};

export default function AppTabs({ tabBarBottomInset = 0 }: AppTabsProps) {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: "bottom",
        tabBarActiveTintColor: "#BC6C25",
        tabBarInactiveTintColor: "#6B705C",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        tabBarStyle: [
          styles.tabBarMobile,
          {
            height: 62 + tabBarBottomInset,
            paddingBottom: Math.max(tabBarBottomInset, 8),
          },
        ],
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
        name="shopping-list"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-cart" color={color} size={size} />
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
  tabBarMobile: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4D9C8",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
});
