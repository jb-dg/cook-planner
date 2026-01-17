import { StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../../theme/design";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: spacing.base * 2,
    paddingBottom: spacing.screen * 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.5,
  },
  topBarText: {
    gap: 2,
  },
  topBarIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  topBarIconActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  rangeText: {
    fontSize: 15,
    color: colors.muted,
  },
  rangeTextLink: {
    color: colors.accent,
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: colors.muted,
  },
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
