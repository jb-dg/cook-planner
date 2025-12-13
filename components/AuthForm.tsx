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
import { colors, radii, shadows, spacing } from "../theme/design";

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
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </Text>
        <Text style={styles.kicker}>
          Gère tes menus, recettes et courses au même endroit.
        </Text>
      </View>
      <View>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="email@exemple.com"
          placeholderTextColor={colors.muted}
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
          placeholderTextColor={colors.muted}
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
            placeholderTextColor={colors.muted}
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
    gap: spacing.base * 1.5,
  },
  titleRow: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  kicker: {
    color: colors.muted,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    ...shadows.soft,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    marginTop: 4,
    fontSize: 13,
  },
  message: {
    color: colors.accent,
    textAlign: "left",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: "center",
    ...shadows.soft,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  link: {
    textAlign: "left",
    color: colors.accent,
    fontWeight: "700",
  },
});
