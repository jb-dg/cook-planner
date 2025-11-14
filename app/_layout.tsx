import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { AuthProvider } from "../contexts/AuthContext";
import { colors } from "../theme/design";

export default function RootLayout() {
  return (
    <AuthProvider>
      <LinearGradient
        colors={["#ffffff", colors.background]}
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
      </LinearGradient>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
