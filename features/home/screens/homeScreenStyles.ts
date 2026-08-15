import { StyleSheet } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme/design";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: spacing.base * 2,
    paddingBottom: 140,
  },

  // Shared "white card" surface — every section on this screen (progress,
  // quick links, recent recipes, shopping summary) is built on top of this.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.subtle,
  },

  dashboardHeader: {
    gap: 6,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 10,
  },
  weekBadge: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  weekBadgeText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subHeading: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: "500",
  },

  softCard: {
    padding: 24,
    gap: spacing.base * 1.2,
    ...shadows.soft,
  },

  todayCard: {
    padding: 24,
    gap: spacing.base * 1.4,
    ...shadows.soft,
  },
  todayHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  todayLabel: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.3,
  },
  todayDate: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  todayMealList: {
    gap: spacing.base,
  },
  todayMealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  todayMealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  todayMealTextBlock: {
    flex: 1,
    gap: 1,
  },
  todayMealLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  todayMealValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  todayMealValueEmpty: {
    color: colors.accentTertiary,
    fontWeight: "500",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: colors.accentTertiary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  progressPercent: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 36,
    letterSpacing: -1,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressFooterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  footerLinkText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  quickLinksRow: {
    flexDirection: "row",
    gap: spacing.base,
  },
  quickLinksColumn: {
    flexDirection: "column",
  },
  quickLinkTile: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
    ...shadows.floating,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  quickLinkLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  recentRecipesRow: {
    gap: spacing.base,
  },
  recentRecipeCard: {
    width: 140,
    overflow: "hidden",
    ...shadows.floating,
  },
  recentRecipeThumb: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceAlt,
  },
  recentRecipeThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  recentRecipeTitle: {
    padding: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  recentRecipesEmpty: {
    padding: 16,
  },
  recentRecipesEmptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  shoppingSummaryCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...shadows.floating,
  },
  shoppingSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  shoppingSummaryTextBlock: {
    flex: 1,
    gap: 2,
  },
  shoppingSummaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  shoppingSummarySubtitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },

  // iPad split view — same shell dimensions as the other tabs' split views
  // (RecipeBooksSplitView, ShoppingListSplitView, ProfileSplitView).
  splitRoot: {
    flex: 1,
    flexDirection: "row",
  },
  splitPanel: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  splitPanelContent: {
    padding: spacing.screen * 0.8,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 1.5,
  },
  splitDetail: {
    flex: 1,
  },
  splitDetailContent: {
    padding: spacing.screen,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 2,
  },
});
