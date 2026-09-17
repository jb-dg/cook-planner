import { useMemo, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";

import PhysicalButtonAnimated from "./PhysicalButtonAnimated";

import { useAuth } from "../contexts/AuthContext";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validatePasswordPresence,
} from "../lib/validation/auth";
import { colors, radii, spacing, typography } from "../theme/design";

type Mode = "signin" | "signup" | "forgot";
type ActiveMode = Mode | "recovery";
type OAuthProvider = "google" | "apple";
type FeedbackMessage = {
  text: string;
  tone: "error" | "success";
};

export default function AuthForm() {
  const {
    signIn,
    signInWithProvider,
    signUp,
    requestPasswordReset,
    updatePassword,
    needsPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState<OAuthProvider | null>(
    null,
  );
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const activeMode: ActiveMode = needsPasswordReset ? "recovery" : mode;
  const busy = submitting || !!socialSubmitting;

  const errors = useMemo(() => {
    const emailError = activeMode === "recovery" ? null : validateEmail(email);
    const passwordError =
      activeMode === "forgot"
        ? null
        : activeMode === "signin"
          ? validatePasswordPresence(password)
          : validatePassword(password);
    const confirmError =
      activeMode === "signup" || activeMode === "recovery"
        ? validateConfirmPassword(password, confirmPassword)
        : null;
    return {
      email: emailError,
      password: passwordError,
      confirm: confirmError,
    };
  }, [activeMode, email, password, confirmPassword]);

  const canSubmit = useMemo(() => {
    if (busy) return false;

    if (activeMode === "forgot") {
      return !errors.email;
    }
    if (activeMode === "recovery") {
      return !errors.password && !errors.confirm;
    }
    if (activeMode === "signup") {
      return !errors.email && !errors.password && !errors.confirm;
    }

    return !errors.email && !errors.password;
  }, [activeMode, busy, errors.confirm, errors.email, errors.password]);

  const submitDisabled = !canSubmit;

  const clearSensitiveFields = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setMessage(null);
    clearSensitiveFields();
  };

  const handleSubmit = async () => {
    if (busy) return;

    setSubmitting(true);
    setMessage(null);
    let result: { success: boolean; message?: string };

    if (activeMode === "signin") {
      result = await signIn({
        email: email.trim(),
        password,
      });
    } else if (activeMode === "signup") {
      result = await signUp({
        email: email.trim(),
        password,
      });
    } else if (activeMode === "forgot") {
      result = await requestPasswordReset(email.trim());
    } else {
      result = await updatePassword(password);
    }

    const { success, message: actionMessage } = result;
    setSubmitting(false);

    if (!success) {
      setMessage({
        text: actionMessage ?? "Une erreur inattendue est survenue.",
        tone: "error",
      });
      return;
    }

    if (activeMode === "signup") {
      setMessage({
        text: "Vérifie ta boîte mail pour confirmer ton compte.",
        tone: "success",
      });
      setConfirmPassword("");
      return;
    }

    if (activeMode === "forgot") {
      setMessage({
        text: "Email envoyé. Vérifie ta boîte mail pour réinitialiser ton mot de passe.",
        tone: "success",
      });
      return;
    }

    if (activeMode === "recovery") {
      setMessage({
        text: "Mot de passe mis à jour. Tu peux continuer.",
        tone: "success",
      });
      clearSensitiveFields();
    }
  };

  const handleSocialSignIn = async (provider: OAuthProvider) => {
    if (busy) return;

    setSocialSubmitting(provider);
    setMessage(null);

    const result = await signInWithProvider(provider);
    setSocialSubmitting(null);

    if (!result.success) {
      setMessage({
        text: result.message ?? "Une erreur inattendue est survenue.",
        tone: "error",
      });
    }
  };

  const titleByMode: Record<ActiveMode, string> = {
    signin: "Connexion",
    signup: "Créer un compte",
    forgot: "Mot de passe oublié",
    recovery: "Nouveau mot de passe",
  };

  const subtitleByMode: Record<ActiveMode, string> = {
    signin: "Gère tes menus, recettes et courses au même endroit.",
    signup: "Crée ton espace cuisine et invite ta famille.",
    forgot: "On t'envoie un lien pour récupérer ton compte.",
    recovery: "Définis un nouveau mot de passe sécurisé.",
  };

  const ctaByMode: Record<ActiveMode, string> = {
    signin: "Se connecter",
    signup: "Créer mon compte",
    forgot: "Envoyer le lien",
    recovery: "Mettre à jour le mot de passe",
  };

  // Dynamic styles built from theme tokens
  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: "100%",
          gap: spacing.md,
        },
        titleRow: {
          gap: spacing.xxs,
          marginBottom: spacing.xs,
        },
        title: {
          fontSize: typography.size.h2,
          lineHeight: typography.lineHeight.h2,
          fontWeight: typography.weight.bold,
          color: colors.text,
        },
        kicker: {
          fontSize: typography.size.bodySmall,
          lineHeight: typography.lineHeight.bodySmall,
          color: colors.muted,
        },
        fieldGroup: {
          gap: spacing.xxs,
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
          color: colors.accentTertiary,
        },
        forgotLink: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: colors.accent,
        },
        input: {
          height: 52,
          borderWidth: 2,
          borderColor: "rgba(165, 165, 141, 0.25)",
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          fontSize: typography.size.body,
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          color: colors.text,
        },
        inputFocused: {
          backgroundColor: colors.surface,
          borderColor: colors.accent,
        },
        inputError: {
          borderColor: colors.danger,
        },
        error: {
          color: colors.danger,
          marginTop: spacing.xxs,
          fontSize: typography.size.label,
        },
        message: {
          fontSize: typography.size.bodySmall,
          fontWeight: typography.weight.semibold,
        },
        messageSuccess: {
          color: colors.accent,
        },
        messageError: {
          color: colors.danger,
        },
        buttonText: {
          color: colors.surface,
          fontWeight: "800",
          fontSize: typography.size.body,
          letterSpacing: 0.3,
        },
        buttonTextDisabled: {
          color: colors.text,
        },
        // Divider
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginVertical: spacing.xs,
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
          color: colors.accentTertiary,
        },
        // Social buttons
        socialRow: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        socialBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          minHeight: 48,
          borderRadius: radii.lg,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          borderWidth: 1,
          borderColor: "rgba(165, 165, 141, 0.25)",
        },
        socialBtnDisabled: {
          opacity: 0.55,
        },
        socialBtnText: {
          fontSize: typography.size.bodySmall,
          fontWeight: "700",
          color: colors.text,
        },
        // Mode switch link
        link: {
          color: colors.accent,
          fontWeight: typography.weight.semibold,
          fontSize: typography.size.bodySmall,
          textAlign: "left",
        },
        switchRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        switchLabel: {
          fontSize: typography.size.bodySmall,
          color: colors.muted,
        },
      }),
    [],
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.titleRow}>
        <Text style={s.title}>{titleByMode[activeMode]}</Text>
        <Text style={s.kicker}>{subtitleByMode[activeMode]}</Text>
      </View>

      {/* Email */}
      {activeMode !== "recovery" ? (
        <View style={s.fieldGroup}>
          <Text style={s.label}>Adresse e-mail</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="email@exemple.com"
            placeholderTextColor={colors.muted}
            style={[s.input, errors.email ? s.inputError : null]}
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            editable={!busy}
          />
          {errors.email ? <Text style={s.error}>{errors.email}</Text> : null}
        </View>
      ) : null}

      {/* Password */}
      {activeMode !== "forgot" ? (
        <View style={s.fieldGroup}>
          <View style={s.fieldHeader}>
            <Text style={s.label}>
              {activeMode === "recovery" ? "Nouveau mot de passe" : "Mot de passe"}
            </Text>
            {activeMode === "signin" ? (
              <Pressable
                onPress={() => switchMode("forgot")}
                disabled={busy}
              >
                <Text style={s.forgotLink}>Oublié ?</Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={colors.muted}
            style={[s.input, errors.password ? s.inputError : null]}
            value={password}
            onChangeText={setPassword}
            textContentType={activeMode === "recovery" ? "newPassword" : "password"}
            editable={!busy}
          />
          {errors.password ? (
            <Text style={s.error}>{errors.password}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Confirm password */}
      {activeMode === "signup" || activeMode === "recovery" ? (
        <View style={s.fieldGroup}>
          <Text style={s.label}>
            {activeMode === "recovery"
              ? "Confirme le nouveau mot de passe"
              : "Confirme le mot de passe"}
          </Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            placeholderTextColor={colors.muted}
            style={[s.input, errors.confirm ? s.inputError : null]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="newPassword"
            editable={!busy}
          />
          {errors.confirm ? (
            <Text style={s.error}>{errors.confirm}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Feedback message */}
      {message ? (
        <Text
          style={[
            s.message,
            message.tone === "error" ? s.messageError : s.messageSuccess,
          ]}
        >
          {message.text}
        </Text>
      ) : null}

      {/* Primary CTA */}
      <PhysicalButtonAnimated onPress={handleSubmit} disabled={submitDisabled}>
        {submitting ? (
          <ActivityIndicator
            color={
              submitDisabled
                ? colors.muted
                : colors.surface
            }
          />
        ) : (
          <Text
            style={[s.buttonText, submitDisabled ? s.buttonTextDisabled : null]}
          >
            {ctaByMode[activeMode]}
          </Text>
        )}
      </PhysicalButtonAnimated>

      {activeMode === "signin" || activeMode === "signup" ? (
        <>
          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>Ou continuer avec</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={s.socialRow}>
            <Pressable
              style={[s.socialBtn, busy ? s.socialBtnDisabled : null]}
              onPress={() => handleSocialSignIn("google")}
              disabled={busy}
            >
              {socialSubmitting === "google" ? (
                // Google's fixed brand red, not a Hearth token — required by their brand guidelines.
                // eslint-disable-next-line no-restricted-syntax
                <ActivityIndicator color="#EA4335" />
              ) : (
                <>
                  {/* eslint-disable-next-line no-restricted-syntax -- Google brand red, see above */}
                  <AntDesign name="google" size={18} color="#EA4335" />
                  <Text style={s.socialBtnText}>Google</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[s.socialBtn, busy ? s.socialBtnDisabled : null]}
              onPress={() => handleSocialSignIn("apple")}
              disabled={busy}
            >
              {socialSubmitting === "apple" ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <AntDesign name="apple" size={18} color={colors.text} />
                  <Text style={s.socialBtnText}>Apple</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      ) : null}

      {/* Mode switch */}
      {activeMode === "recovery" ? null : (
        <View style={s.switchRow}>
          {activeMode === "forgot" ? (
            <>
              <Text style={s.switchLabel}>Tu te souviens du mot de passe ?</Text>
              <Pressable
                onPress={() => switchMode("signin")}
                disabled={busy}
              >
                <Text style={s.link}>Se connecter</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.switchLabel}>
                {activeMode === "signin" ? "Nouveau ici ?" : "Déjà un compte ?"}
              </Text>
              <Pressable
                onPress={() =>
                  switchMode(activeMode === "signin" ? "signup" : "signin")
                }
                disabled={busy}
              >
                <Text style={s.link}>
                  {activeMode === "signin" ? "Créer un compte" : "Se connecter"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}
