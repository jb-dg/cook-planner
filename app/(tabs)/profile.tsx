import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../contexts/AuthContext";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      Alert.alert("Erreur", result.message ?? "Déconnexion impossible");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profil</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
      </View>
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    gap: 4,
  },
  label: {
    color: "#6b7280",
    fontSize: 13,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
