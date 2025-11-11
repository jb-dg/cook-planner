import { Redirect } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../contexts/AuthContext";

export default function AuthScreen() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loader}>
        <Text>Chargement…</Text>
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cook Planner</Text>
        <Text style={styles.subtitle}>
          Connecte-toi pour retrouver tes recettes et ton planning.
        </Text>
      </View>
      <AuthForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
