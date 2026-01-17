import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, spacing } from "../../../theme/design";
import { Toast as ToastType } from "../utils/types";

type Props = {
  toast: ToastType;
};

export const Toast = ({ toast }: Props) => {
  return (
    <View
      style={[
        styles.toast,
        toast.type === "success" && styles.toastSuccess,
        toast.type === "error" && styles.toastError,
      ]}
    >
      <Text style={styles.toastText}>{toast.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.screen,
    right: spacing.screen,
    bottom: spacing.screen,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  toastSuccess: {
    borderColor: colors.accent,
  },
  toastError: {
    borderColor: colors.danger,
  },
  toastText: {
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
});
