import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../contexts/AuthContext";
import { colors, radii, spacing } from "../../theme/design";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      Alert.alert("Erreur", result.message ?? "Déconnexion impossible");
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.screen,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  card: {
    padding: spacing.card,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  button: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
