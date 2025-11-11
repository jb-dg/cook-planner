import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

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
  signIn: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SUPABASE_REDIRECT_URL = Linking.createURL("auth");

const formatAuthError = (error: AuthError | Error) => {
  const fallback = "Impossible de traiter la requête.";
  const message = "message" in error ? error.message : fallback;
  switch (message) {
    case "Invalid login credentials":
      return "Identifiants invalides.";
    case "Email not confirmed":
      return "Confirme ton email avant de te connecter.";
    default:
      return message || fallback;
  }
};

const createResult = (error: AuthError | Error | null): AuthActionResult =>
  error ? { success: false, message: formatAuthError(error) } : { success: true };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setInitializing(false);
    });

    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        await supabase.auth.exchangeCodeForSession(url);
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
  }, []);

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

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return createResult(error);
    } catch (error) {
      return createResult(error as Error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, initializing, signIn, signUp, signOut }}
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
