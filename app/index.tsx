import { Redirect } from "expo-router";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";

import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.heading}>Initialisation de la session…</Text>
      </SafeAreaView>
    );
  }

  return session ? <Redirect href="/(tabs)" /> : <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "500",
  },
});
