import { SafeAreaView, StyleSheet, Text } from "react-native";

import SupabaseAuth from "../components/SupabaseAuth";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Cook Planner</Text>
      <SupabaseAuth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
});
