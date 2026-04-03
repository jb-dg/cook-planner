import { useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";

export const useTabsLayoutAuthState = () => {
  const { session, initializing, needsPasswordReset } = useAuth();

  return useMemo(
    () => ({
      initializing,
      shouldRedirectToAuth: !session || needsPasswordReset,
      displayName: session?.user.email?.split("@")[0] ?? "Kitchen",
    }),
    [initializing, needsPasswordReset, session],
  );
};
