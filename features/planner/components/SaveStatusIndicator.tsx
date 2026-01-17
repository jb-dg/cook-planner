import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing } from "../../../theme/design";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
};

export const SaveStatusIndicator = ({ status, lastSaved, error }: Props) => {
  if (status === "idle" && !lastSaved) {
    return null;
  }

  const getStatusConfig = () => {
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
          const timeAgo = getTimeAgo(lastSaved);
          return {
            icon: "check" as const,
            text: `Enregistré ${timeAgo}`,
            color: colors.muted,
          };
        }
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Feather name={config.icon} size={14} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
};

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 10) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;

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
