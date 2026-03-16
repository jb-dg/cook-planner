import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PhysicalButtonAnimated from "./PhysicalButtonAnimated";

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
    return {
      email: emailError,
      password: passwordError,
      confirm: confirmError,
    };
  }, [email, password, confirmPassword, mode]);

  const canSubmit =
    !submitting &&
    !errors.email &&
    !errors.password &&
    (mode === "signin" || !errors.confirm);
  const submitDisabled = !canSubmit;

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    const action = mode === "signin" ? signIn : signUp;
    const { success, message: actionMessage } = await action({
      email,
      password,
    });
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
        fieldGroup: {
          gap: t.spacing.xxs,
        },
        fieldHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginLeft: 2,
        },
        label: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#A5A58D",
        },
        forgotLink: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: t.colors.primary,
        },
        input: {
          height: 52,
          borderWidth: 2,
          borderColor: "rgba(165, 165, 141, 0.25)",
          borderRadius: t.radius.lg,
          paddingHorizontal: t.components.textInput.paddingHorizontal,
          fontSize: t.typography.size.body,
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          color: t.colors.textPrimary,
        },
        inputFocused: {
          backgroundColor: "#FFFFFF",
          borderColor: t.colors.primary,
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
        buttonTextDisabled: {
          color: t.colors.textPrimary,
        },
        // Divider
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: t.spacing.sm,
          marginVertical: t.spacing.xs,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: "rgba(165, 165, 141, 0.25)",
        },
        dividerText: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#A5A58D",
        },
        // Social buttons
        socialRow: {
          flexDirection: "row",
          gap: t.spacing.sm,
        },
        socialBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing.xs,
          height: 52,
          borderRadius: t.radius.lg,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          borderWidth: 1,
          borderColor: "rgba(165, 165, 141, 0.25)",
        },
        socialBtnText: {
          fontSize: t.typography.size.bodySmall,
          fontWeight: "700",
          color: t.colors.textPrimary,
        },
        // Mode switch link
        link: {
          color: t.colors.primary,
          fontWeight: t.typography.weight.semibold,
          fontSize: t.typography.size.bodySmall,
          textAlign: "left",
        },
        switchRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        switchLabel: {
          fontSize: t.typography.size.bodySmall,
          color: t.colors.textMuted,
        },
      }),
    [t],
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
      <View style={s.fieldGroup}>
        <Text style={s.label}>Adresse e-mail</Text>
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
      <View style={s.fieldGroup}>
        <View style={s.fieldHeader}>
          <Text style={s.label}>Mot de passe</Text>
          {mode === "signin" ? (
            <Pressable>
              <Text style={s.forgotLink}>Oublié ?</Text>
            </Pressable>
          ) : null}
        </View>
        <TextInput
          placeholder="••••••••"
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
        <View style={s.fieldGroup}>
          <Text style={s.label}>Confirme le mot de passe</Text>
          <TextInput
            placeholder="••••••••"
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
      <PhysicalButtonAnimated onPress={handleSubmit} disabled={submitDisabled}>
        {submitting ? (
          <ActivityIndicator
            color={
              submitDisabled
                ? t.colors.textMuted
                : t.components.button.primary.textColor
            }
          />
        ) : (
          <Text
            style={[s.buttonText, submitDisabled ? s.buttonTextDisabled : null]}
          >
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Text>
        )}
      </PhysicalButtonAnimated>

      {/* Divider */}
      {/* <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>Ou continuer avec</Text>
        <View style={s.dividerLine} />
      </View> */}

      {/* Social buttons */}
      {/* <View style={s.socialRow}>
        <Pressable style={s.socialBtn}>
          <AntDesign name="google" size={18} color="#EA4335" />
          <Text style={s.socialBtnText}>Google</Text>
        </Pressable>
        <Pressable style={s.socialBtn}>
          <AntDesign name="apple1" size={18} color={t.colors.textPrimary} />
          <Text style={s.socialBtnText}>Apple</Text>
        </Pressable>
      </View> */}

      {/* Mode switch */}
      <View style={s.switchRow}>
        <Text style={s.switchLabel}>
          {mode === "signin" ? "Nouveau ici ?" : "Déjà un compte ?"}
        </Text>
        <Pressable
          onPress={() =>
            setMode((prev) => (prev === "signin" ? "signup" : "signin"))
          }
          disabled={submitting}
        >
          <Text style={s.link}>
            {mode === "signin" ? "Créer un compte" : "Se connecter"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
