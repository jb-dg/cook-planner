import { Platform, StyleSheet } from "react-native";

import { colors, layout, radii, spacing } from "@/theme/design";

const shadowCard = Platform.select({
  ios: {
    shadowColor: "#6B705C",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 3,
    shadowColor: "#000",
  },
  default: {},
});

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: spacing.base * 1.5,
    paddingBottom: spacing.screen + 140,
  },
  containerWeb: {
    paddingTop: layout.webNavOffset + spacing.screen,
    paddingBottom: spacing.screen * 2,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  headerCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.card,
    gap: 4,
    ...shadowCard,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  actionButton: {
    flex: 1,
  },
  recipeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.base * 0.6,
    minHeight: 46,
    paddingVertical: spacing.base * 0.8,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recipeButtonText: {
    flexShrink: 1,
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: colors.danger,
    fontWeight: "600",
  },
  loader: {
    marginTop: spacing.screen,
  },
  emptyState: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.card,
    gap: 4,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  list: {
    gap: spacing.base * 0.7,
  },
  clearButton: {
    alignSelf: "center",
    paddingHorizontal: spacing.card,
    paddingVertical: 10,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clearButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
});
