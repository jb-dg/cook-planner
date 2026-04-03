import { useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";

export const useAuthScreenState = () => {
  const { session, initializing, needsPasswordReset } = useAuth();

  return useMemo(
    () => ({
      isInitializing: initializing,
      shouldRedirectToTabs: !!session && !needsPasswordReset,
    }),
    [initializing, needsPasswordReset, session],
  );
};
