import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "../lib/validation/auth";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const errors = useMemo(() => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError =
      mode === "signup"
        ? validateConfirmPassword(password, confirmPassword)
        : null;
    return { email: emailError, password: passwordError, confirm: confirmError };
  }, [email, password, confirmPassword, mode]);

  const canSubmit =
    !submitting &&
    !errors.email &&
    !errors.password &&
    (mode === "signin" || !errors.confirm);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    const action = mode === "signin" ? signIn : signUp;
    const { success, message: actionMessage } = await action({ email, password });
    setSubmitting(false);

    if (!success) {
      setMessage(actionMessage ?? "Une erreur inattendue est survenue.");
      return;
    }

    if (mode === "signup") {
      setMessage("Vérifie ta boîte mail pour confirmer ton compte.");
      setConfirmPassword("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "signin" ? "Connexion" : "Créer un compte"}
      </Text>
      <View>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="email@exemple.com"
          style={[styles.input, errors.email && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          textContentType="emailAddress"
          editable={!submitting}
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
      </View>
      <View>
        <TextInput
          placeholder="Mot de passe"
          secureTextEntry
          style={[styles.input, errors.password && styles.inputError]}
          value={password}
          onChangeText={setPassword}
          textContentType="password"
          editable={!submitting}
        />
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
      </View>
      {mode === "signup" ? (
        <View>
          <TextInput
            placeholder="Confirme ton mot de passe"
            secureTextEntry
            style={[styles.input, errors.confirm && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="password"
            editable={!submitting}
          />
          {errors.confirm ? <Text style={styles.error}>{errors.confirm}</Text> : null}
        </View>
      ) : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={() =>
          setMode((prev) => (prev === "signin" ? "signup" : "signin"))
        }
        disabled={submitting}
      >
        <Text style={styles.link}>
          {mode === "signin"
            ? "Nouveau compte? Inscris-toi"
            : "J'ai déjà un compte"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#d14343",
  },
  error: {
    color: "#d14343",
    marginTop: 4,
    fontSize: 13,
  },
  message: {
    color: "#0f5d2f",
    textAlign: "center",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  link: {
    textAlign: "center",
    color: "#555",
    fontWeight: "500",
  },
});
