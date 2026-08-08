import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, EmailOtpType, Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { ensureProfileRecord } from "../lib/profile";
import { supabase } from "../lib/supabase";

type AuthCredentials = {
  email: string;
  password: string;
};

type AuthActionResult = {
  success: boolean;
  message?: string;
};

type OAuthProvider = "google" | "apple";

const NONCE_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  needsPasswordReset: boolean;
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signInWithProvider: (provider: OAuthProvider) => Promise<AuthActionResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NATIVE_AUTH_REDIRECT_URL = "cookplanner://auth/callback";

const SUPABASE_REDIRECT_URL = NATIVE_AUTH_REDIRECT_URL;
const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

const isEmailOtpType = (value: string): value is EmailOtpType =>
  EMAIL_OTP_TYPES.includes(value as EmailOtpType);

const formatAuthError = (error: AuthError | Error) => {
  const fallback = "Impossible de traiter la requête.";
  const message = "message" in error ? error.message : fallback;
  switch (message) {
    case "Invalid login credentials":
      return "Identifiants invalides.";
    case "Email not confirmed":
      return "Confirme ton email avant de te connecter.";
    case "Auth session missing!":
      return "Session invalide. Recommence depuis le lien reçu par email.";
    case "New password should be different from the old password.":
      return "Choisis un mot de passe différent de l'ancien.";
    default:
      return message || fallback;
  }
};

const createResult = (error: AuthError | Error | null): AuthActionResult =>
  error ? { success: false, message: formatAuthError(error) } : { success: true };

const generateNonce = (length = 32) => {
  const randomBytes = Crypto.getRandomBytes(length);

  return Array.from(randomBytes)
    .map((byte) => NONCE_CHARS[byte % NONCE_CHARS.length])
    .join("");
};

const isAppleAuthCanceledError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "ERR_REQUEST_CANCELED";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const handledAuthUrlsRef = useRef(new Set<string>());

  const syncProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) return;
    try {
      await ensureProfileRecord(currentSession.user);
    } catch (error) {
      console.warn("profile sync failed", error);
    }
  }, []);

  const extractAuthParams = (normalizedUrl: string) => {
    const params = new URLSearchParams();
    const { queryParams } = Linking.parse(normalizedUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (typeof value === "string") {
          params.set(key, value);
        }
      });
    }

    const hashIndex = normalizedUrl.indexOf("#");
    if (hashIndex !== -1 && hashIndex + 1 < normalizedUrl.length) {
      const hashParams = new URLSearchParams(normalizedUrl.slice(hashIndex + 1));
      hashParams.forEach((value, key) => {
        params.set(key, value);
      });
    }

    return params;
  };

  const handleAuthUrl = useCallback(async (url?: string | null) => {
    if (!url) return;

    const normalizedUrl = url.trim();
    if (!normalizedUrl) return;

    const params = extractAuthParams(normalizedUrl);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const canVerifyOtp = !!tokenHash && !!type && isEmailOtpType(type);

    if (!code && !canVerifyOtp && !(accessToken && refreshToken)) {
      return;
    }

    if (handledAuthUrlsRef.current.has(normalizedUrl)) {
      return;
    }
    handledAuthUrlsRef.current.add(normalizedUrl);

    try {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        if (type === "recovery") {
          setNeedsPasswordReset(true);
        }
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (type === "recovery") {
          setNeedsPasswordReset(true);
        }
        return;
      }

      if (tokenHash && type && isEmailOtpType(type)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) throw error;
        if (type === "recovery") {
          setNeedsPasswordReset(true);
        }
      }
    } catch (error) {
      // Allow retry if the first attempt failed for transient reasons.
      handledAuthUrlsRef.current.delete(normalizedUrl);
      console.error("Supabase deep-link error", error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitializing(false);
      syncProfile(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setInitializing(false);
      syncProfile(currentSession);

      if (event === "PASSWORD_RECOVERY") {
        setNeedsPasswordReset(true);
      }
      if (event === "USER_UPDATED" || event === "SIGNED_OUT") {
        setNeedsPasswordReset(false);
      }
    });

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (!mounted || !initialUrl) return;
        return handleAuthUrl(initialUrl);
      })
      .catch((error) => {
        console.error("Supabase initial URL error", error);
      });

    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      void handleAuthUrl(url);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [handleAuthUrl, syncProfile]);

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  const signInWithNativeApple = useCallback(async () => {
    try {
      if (Platform.OS !== "ios") {
        return {
          success: false,
          message:
            "Sign in with Apple natif est disponible uniquement sur iOS.",
        };
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          message: "Sign in with Apple n'est pas disponible sur cet appareil.",
        };
      }

      const rawNonce = generateNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        nonce: hashedNonce,
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          success: false,
          message: "Apple n'a pas retourné identityToken.",
        };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) {
        return createResult(error);
      }

      const fullName = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      if (credential.fullName && fullName) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            given_name: credential.fullName.givenName,
            family_name: credential.fullName.familyName,
          },
        });

        if (updateError) {
          console.warn("Apple user metadata update failed", updateError);
        }
      }

      return { success: true };
    } catch (error) {
      if (isAppleAuthCanceledError(error)) {
        return {
          success: false,
          message: "Connexion annulée.",
        };
      }

      return createResult(error as Error);
    }
  }, []);

  const signInWithProvider = useCallback(
    async (provider: OAuthProvider) => {
      try {
        if (provider === "apple" && Platform.OS === "ios") {
          return signInWithNativeApple();
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: SUPABASE_REDIRECT_URL,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          return createResult(error);
        }

        if (!data.url) {
          return {
            success: false,
            message: "Impossible d'ouvrir la connexion externe.",
          };
        }

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          SUPABASE_REDIRECT_URL,
        );

        if (result.type === "success") {
          await handleAuthUrl(result.url);
          return { success: true };
        }

        return {
          success: false,
          message: "Connexion annulée.",
        };
      } catch (error) {
        return createResult(error as Error);
      }
    },
    [handleAuthUrl, signInWithNativeApple],
  );

  const signUp = useCallback(async (credentials: AuthCredentials) => {
    try {
      const { error } = await supabase.auth.signUp({
        ...credentials,
        options: {
          emailRedirectTo: SUPABASE_REDIRECT_URL,
        },
      });
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: SUPABASE_REDIRECT_URL,
      });
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) {
        setNeedsPasswordReset(false);
      }
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setNeedsPasswordReset(false);
      }
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        initializing,
        needsPasswordReset,
        signIn,
        signInWithProvider,
        signUp,
        requestPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
