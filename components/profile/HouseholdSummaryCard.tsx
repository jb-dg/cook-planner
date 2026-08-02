import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import PhysicalButton from "@/components/PhysicalButton";
import { colors, radii, shadows, spacing } from "@/theme/design";

import type { Household, HouseholdMember } from "./types";

type HouseholdSummaryCardProps = {
  loadingHousehold: boolean;
  household: Household | null;
  householdMembers: HouseholdMember[];
  householdError: string | null;
  isOwner: boolean;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenManage: () => void;
};

export default function HouseholdSummaryCard({
  loadingHousehold,
  household,
  householdMembers,
  householdError,
  isOwner,
  onOpenCreate,
  onOpenJoin,
  onOpenManage,
}: HouseholdSummaryCardProps) {
  if (loadingHousehold) {
    return (
      <View style={styles.householdCard}>
        <ActivityIndicator color="#6B705C" />
      </View>
    );
  }

  if (!household) {
    return (
      <View style={[styles.householdCard, styles.householdCardEmpty]}>
        <Text style={styles.householdName}>Aucun foyer relié</Text>
        <Text style={styles.helper}>
          Utilise les actions ci-dessous pour créer ou rejoindre un foyer partagé.
        </Text>
        <View style={styles.householdActions}>
          <View style={styles.secondaryButtonWrapper}>
            <PhysicalButton variant="secondary" onPress={onOpenCreate}>
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                Créer un foyer
              </Text>
            </PhysicalButton>
          </View>
          <View style={styles.secondaryButtonWrapper}>
            <PhysicalButton variant="secondary" onPress={onOpenJoin}>
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                Rejoindre
              </Text>
            </PhysicalButton>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.householdCard}>
      <View style={styles.householdHeader}>
        <View style={styles.householdTitleBlock}>
          <Text style={styles.householdLabel}>Foyer actif</Text>
          <Text style={styles.householdName} numberOfLines={1}>
            {household.name}
          </Text>
        </View>
        <View style={styles.householdBadges}>
          <Text style={styles.statusPill} numberOfLines={1}>
            {isOwner ? "Admin" : "Membre"}
          </Text>
          <Text style={styles.statusPill} numberOfLines={1}>
            {householdMembers.length} membre
            {householdMembers.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={styles.householdMetaRow}>
        <View style={styles.householdColumn}>
          <Text style={styles.householdLabel}>Planning</Text>
          <Text style={styles.householdValue}>Synchronisé</Text>
        </View>
        <View style={styles.householdColumn}>
          <Text style={styles.householdLabel}>Partage</Text>
          <Text style={styles.householdValue}>En temps réel</Text>
        </View>
      </View>
      <Text style={styles.membersTitle}>Membres</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.memberCarousel}
      >
        {householdMembers.length === 0 ? (
          <Text style={styles.helper}>{"Aucun membre pour l'instant."}</Text>
        ) : (
          householdMembers.map((member) => (
            <View key={member.user_id} style={styles.memberBadge}>
              <Text style={styles.memberBadgeLetter}>
                {(member.pseudo ?? "?").charAt(0).toUpperCase()}
              </Text>
              <Text style={styles.memberBadgeLabel}>
                {member.isCurrentUser ? "Moi" : (member.pseudo ?? "Invité")}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
      <Pressable style={styles.manageButton} onPress={onOpenManage}>
        <Text style={styles.manageButtonText} numberOfLines={1}>
          {isOwner ? "Gérer le foyer" : "Voir les membres"}
        </Text>
      </Pressable>
      {householdError ? <Text style={styles.errorText}>{householdError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  householdCard: {
    gap: 14,
    borderRadius: 24,
    padding: spacing.screen,
    backgroundColor: "rgb(255, 255, 255)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.subtle,
  },
  householdCardEmpty: {
    borderStyle: "dashed",
    borderColor: colors.cardBorder,
    alignItems: "stretch",
  },
  householdActions: {
    flexDirection: "row",
    gap: 10,
  },
  householdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  householdTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  householdBadges: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  householdMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  householdColumn: {
    flex: 1,
  },
  householdLabel: {
    color: colors.accentTertiary,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  householdValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
    overflow: "hidden",
    flexShrink: 1,
  },
  membersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberCarousel: {
    gap: 14,
    paddingVertical: 6,
  },
  memberBadge: {
    alignItems: "center",
    gap: 6,
  },
  memberBadgeLetter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: colors.accent,
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 20,
    lineHeight: 48,
    overflow: "hidden",
  },
  memberBadgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  manageButton: {
    marginTop: 6,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.base,
    alignItems: "center",
    backgroundColor: "rgba(188, 108, 37, 0.05)",
  },
  manageButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
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
  secondaryButtonWrapper: {
    flex: 1,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontWeight: "900",
    fontSize: 15,
    flexShrink: 1,
  },
});
