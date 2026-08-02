import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme/design";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
};

const AUTO_HIDE_DELAY_MS = 4000;
const FADE_DURATION_MS = 400;

export const SaveStatusIndicator = ({ status, lastSaved, error }: Props) => {
  const [mounted, setMounted] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearHideTimeout = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    if (status === "idle" && !lastSaved) {
      // Nothing to show — fade out if currently visible, otherwise stay hidden.
      clearHideTimeout();
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setMounted(false));
      return;
    }

    // Something to show — make sure it's visible.
    clearHideTimeout();
    setMounted(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();

    // Only auto-hide the passive "saved a while ago" confirmation — active
    // states (saving/error) stay on screen as long as they're relevant.
    if (status === "idle" && lastSaved) {
      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION_MS,
          useNativeDriver: true,
        }).start(() => setMounted(false));
      }, AUTO_HIDE_DELAY_MS);
    }

    return clearHideTimeout;
  }, [status, lastSaved, opacity]);

  if (!mounted) {
    return null;
  }

  const config = getStatusConfig(status, lastSaved, error);
  if (!config) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Feather name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </Animated.View>
  );
};

const getStatusConfig = (
  status: SaveStatus,
  lastSaved: Date | null,
  error: string | null,
) => {
  switch (status) {
    case "saving":
      return {
        icon: "loader" as const,
        text: "Enregistrement...",
        color: colors.muted,
      };
    case "saved":
      return {
        icon: "check-circle" as const,
        text: "Enregistré",
        color: colors.accent,
      };
    case "error":
      return {
        icon: "alert-circle" as const,
        text: error || "Erreur",
        color: colors.danger,
      };
    default:
      if (lastSaved) {
        return {
          icon: "check" as const,
          text: `Enregistré ${getTimeAgo(lastSaved)}`,
          color: colors.muted,
        };
      }
      return null;
  }
};

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  return "aujourd'hui";
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.5,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base * 0.5,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
