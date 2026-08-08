import { StyleSheet } from "react-native";

import { colors, radii, shadows, spacing } from "@/theme/design";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: 20,
    paddingBottom: 160,
  },

  heroCard: {
    borderRadius: 24,
    padding: spacing.screen,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.subtle,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#BC6C25",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.3,
  },
  heroEmail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },

  section: {
    padding: spacing.screen,
    borderRadius: 24,
    gap: 14,
    backgroundColor: "rgb(255, 255, 255)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.subtle,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.muted,
  },

  actionList: {
    gap: 10,
  },

  signOutInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  modalCloseIcon: {
    position: "absolute",
    top: spacing.screen - 6,
    right: spacing.screen,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.subtle,
  },
  modalContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.screen,
    gap: 16,
    paddingBottom: 120,
  },
  householdModalContent: {
    flexGrow: 1,
  },
  modalBlock: {
    gap: 12,
    paddingVertical: 8,
  },
  subheading: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  label: {
    color: colors.accentTertiary,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  avatarEditorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarEditorPreview: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.accent,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditorImage: {
    width: "100%",
    height: "100%",
  },
  avatarEditorLetter: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  avatarUploadButton: {
    flex: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  helper: {
    color: colors.accentTertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  successText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  inviteRowText: {
    flex: 1,
  },
  inviteRowActions: {
    flexDirection: "row",
    gap: 8,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  secondaryButtonText: {
    color: colors.muted,
    fontWeight: "900",
    fontSize: 15,
    flexShrink: 1,
  },
});
