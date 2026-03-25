import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, EmailOtpType, Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

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

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  needsPasswordReset: boolean;
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SUPABASE_REDIRECT_URL = Linking.createURL("auth");
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const syncProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) return;
    try {
      await ensureProfileRecord(currentSession.user);
    } catch (error) {
      console.warn("profile sync failed", error);
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

    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        const { queryParams } = Linking.parse(url);
        const code =
          typeof queryParams?.code === "string" ? queryParams.code : null;
        const tokenHash =
          typeof queryParams?.token_hash === "string"
            ? queryParams.token_hash
            : null;
        const type =
          typeof queryParams?.type === "string" ? queryParams.type : null;

        if (code) {
          await supabase.auth.exchangeCodeForSession(url);
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
          if (!error && type === "recovery") {
            setNeedsPasswordReset(true);
          }
        }
      } catch (error) {
        console.error("Supabase deep-link error", error);
      }
    };

    const linkingSub = Linking.addEventListener("url", handleDeepLink);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [syncProfile]);

  const signIn = useCallback(async (credentials: AuthCredentials) => {
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

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
