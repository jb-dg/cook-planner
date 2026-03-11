import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PhysicalButton from "./PhysicalButton";

import { useAuth } from "../contexts/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "../lib/validation/auth";
import { useTheme } from "../theme/useTheme";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const t = useTheme();

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

  // Dynamic styles built from theme tokens
  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: "100%",
          gap: t.spacing.md,
        },
        titleRow: {
          gap: t.spacing.xxs,
          marginBottom: t.spacing.xs,
        },
        title: {
          fontSize: t.typography.size.h2,
          lineHeight: t.typography.lineHeight.h2,
          fontWeight: t.typography.weight.bold,
          color: t.colors.textPrimary,
        },
        kicker: {
          fontSize: t.typography.size.bodySmall,
          lineHeight: t.typography.lineHeight.bodySmall,
          color: t.colors.textMuted,
        },
        input: {
          height: t.components.textInput.height,
          borderWidth: 1,
          borderColor: t.components.textInput.borderColor,
          borderRadius: t.components.textInput.borderRadius,
          paddingHorizontal: t.components.textInput.paddingHorizontal,
          fontSize: t.typography.size.body,
          backgroundColor: t.components.textInput.backgroundColor,
          color: t.colors.textPrimary,
          ...t.shadow.sm,
        },
        inputError: {
          borderColor: t.colors.error,
        },
        error: {
          color: t.colors.error,
          marginTop: t.spacing.xxs,
          fontSize: t.typography.size.label,
        },
        message: {
          color: t.colors.primary,
          fontSize: t.typography.size.bodySmall,
          fontWeight: t.typography.weight.semibold,
        },
        buttonText: {
          color: t.components.button.primary.textColor,
          fontWeight: "800",
          fontSize: t.typography.size.body,
          letterSpacing: 0.3,
        },
        link: {
          color: t.colors.primary,
          fontWeight: t.typography.weight.semibold,
          fontSize: t.typography.size.bodySmall,
          textAlign: "left",
        },
      }),
    [t]
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.titleRow}>
        <Text style={s.title}>
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </Text>
        <Text style={s.kicker}>
          Gère tes menus, recettes et courses au même endroit.
        </Text>
      </View>

      {/* Email */}
      <View>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="email@exemple.com"
          placeholderTextColor={t.components.textInput.placeholderColor}
          style={[s.input, errors.email ? s.inputError : null]}
          value={email}
          onChangeText={setEmail}
          textContentType="emailAddress"
          editable={!submitting}
        />
        {errors.email ? <Text style={s.error}>{errors.email}</Text> : null}
      </View>

      {/* Password */}
      <View>
        <TextInput
          placeholder="Mot de passe"
          secureTextEntry
          placeholderTextColor={t.components.textInput.placeholderColor}
          style={[s.input, errors.password ? s.inputError : null]}
          value={password}
          onChangeText={setPassword}
          textContentType="password"
          editable={!submitting}
        />
        {errors.password ? (
          <Text style={s.error}>{errors.password}</Text>
        ) : null}
      </View>

      {/* Confirm password (signup only) */}
      {mode === "signup" ? (
        <View>
          <TextInput
            placeholder="Confirme ton mot de passe"
            secureTextEntry
            placeholderTextColor={t.components.textInput.placeholderColor}
            style={[s.input, errors.confirm ? s.inputError : null]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="password"
            editable={!submitting}
          />
          {errors.confirm ? (
            <Text style={s.error}>{errors.confirm}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Feedback message */}
      {message ? <Text style={s.message}>{message}</Text> : null}

      {/* Primary CTA */}
      <PhysicalButton
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={t.components.button.primary.textColor} />
        ) : (
          <Text style={s.buttonText}>
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Text>
        )}
      </PhysicalButton>

      {/* Mode switch */}
      <Pressable
        onPress={() =>
          setMode((prev) => (prev === "signin" ? "signup" : "signin"))
        }
        disabled={submitting}
      >
        <Text style={s.link}>
          {mode === "signin"
            ? "Nouveau compte ? Inscris-toi"
            : "J'ai déjà un compte"}
        </Text>
      </Pressable>
    </View>
  );
}
