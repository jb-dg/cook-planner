import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { AnimatedSplashScreen } from "../components/AnimatedSplashScreen";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  return (
    <AuthProvider>
      <LinearGradient
        colors={["#FDF8F1", "#F5EFE4", "#FDF8F1"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {showAnimatedSplash ? (
          <AnimatedSplashScreen onFinish={() => setShowAnimatedSplash(false)} />
        ) : null}
      </LinearGradient>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
