import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

export default function SupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    // Gère le deep link (ex: cookplanner://auth#access_token=...)
    const handleDeepLink = async ({ url }: { url: string }) => {
      await supabase.auth.exchangeCodeForSession(url);
    };
    const sub = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setLoading(false);
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const credentials = { email, password };

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: {
              emailRedirectTo: "cookplanner://auth",
            },
          });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Vérifie ta boîte mail pour confirmer ton compte.");
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      setMessage(error.message);
    }
  };

  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connecté</Text>
        <Text style={styles.text}>{session.user.email}</Text>
        <Button title="Se déconnecter" onPress={handleSignOut} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "signin" ? "Connexion Supabase" : "Créer un compte"}
      </Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email@exemple.com"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      {mode === "signup" ? (
        <TextInput
          placeholder="Confirme ton mot de passe"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      ) : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.actions}>
          <Button
            onPress={handleAuth}
            title={mode === "signin" ? "Se connecter" : "Créer un compte"}
            disabled={!email || !password}
          />
          <Button
            onPress={() =>
              setMode((prev) => (prev === "signin" ? "signup" : "signin"))
            }
            title={
              mode === "signin" ? "Créer un compte" : "J'ai déjà un compte"
            }
            color="#555"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  actions: {
    gap: 12,
  },
  message: {
    color: "#c00",
    textAlign: "center",
  },
  text: {
    marginBottom: 16,
    textAlign: "center",
  },
});
