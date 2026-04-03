import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { radii } from "@/theme/design";

type AppTabsProps = {
  mode: "web" | "native";
  tabBarBottom?: number;
};

export default function AppTabs({ mode, tabBarBottom = 16 }: AppTabsProps) {
  const isWeb = mode === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: isWeb ? styles.sceneWeb : undefined,
        tabBarPosition: "bottom",
        tabBarActiveTintColor: "#BC6C25",
        tabBarInactiveTintColor: "#6B705C",
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
}

const styles = StyleSheet.create({
  sceneWeb: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    backgroundColor: "transparent",
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
