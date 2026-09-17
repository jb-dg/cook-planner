import "../lib/forceFontScaling";

import {
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { CoveredByYourGrace_400Regular } from "@expo-google-fonts/covered-by-your-grace";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";

import { AnimatedSplashScreen } from "../components/AnimatedSplashScreen";
import { AuthProvider } from "../contexts/AuthContext";
import { colors } from "../theme/design";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_400Regular_Italic,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    CoveredByYourGrace_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <LinearGradient
        colors={[colors.background, colors.surfaceAlt, colors.background]}
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
    backgroundColor: colors.background,
  },
});
