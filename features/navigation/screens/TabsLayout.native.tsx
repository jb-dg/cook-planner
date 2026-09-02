import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppTabs from "../components/AppTabs";
import { useTabsLayoutAuthState } from "../hooks/useTabsLayoutAuthState";

export default function TabsLayoutNative() {
  const { initializing, shouldRedirectToAuth } = useTabsLayoutAuthState();
  const insets = useSafeAreaInsets();

  if (initializing) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (shouldRedirectToAuth) {
    return <Redirect href="/auth" />;
  }

  return <AppTabs tabBarBottomInset={insets.bottom} />;
}
