import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import PhysicalButton from "@/components/PhysicalButton";
import { colors, radii, shadows, spacing } from "@/theme/design";

import type { Household, HouseholdMember } from "./types";

type HouseholdSummaryCardProps = {
  loadingHousehold: boolean;
  household: Household | null;
  householdMembers: HouseholdMember[];
  householdError: string | null;
  isOwner: boolean;
  removingMemberId: string | null;
  leavingHousehold: boolean;
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenManage: () => void;
  onShareInviteCode: () => void;
  onRemoveMember: (userId: string) => void;
  onLeaveHousehold: () => void;
};

export default function HouseholdSummaryCard({
  loadingHousehold,
  household,
  householdMembers,
  householdError,
  isOwner,
  removingMemberId,
  leavingHousehold,
  onOpenCreate,
  onOpenJoin,
  onShareInviteCode,
  onRemoveMember,
  onLeaveHousehold,
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

      <Pressable style={styles.inviteCodeRow} onPress={onShareInviteCode}>
        <View style={styles.inviteCodeText}>
          <Text style={styles.householdLabel}>Code d'invitation</Text>
          <Text style={styles.inviteCodeValue}>{household.invite_code}</Text>
        </View>
        <View style={styles.shareButton}>
          <Feather name="share-2" size={16} color={colors.accent} />
          <Text style={styles.shareButtonText}>Partager</Text>
        </View>
      </Pressable>

      <Text style={styles.membersTitle}>Membres</Text>
      <View style={styles.memberList}>
        {householdMembers.length === 0 ? (
          <Text style={styles.helper}>{"Aucun membre pour l'instant."}</Text>
        ) : (
          householdMembers.map((member) => (
            <View key={member.user_id} style={styles.memberRow}>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeLetter}>
                  {(member.pseudo ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberRowLabel} numberOfLines={1}>
                {member.isCurrentUser ? "Moi" : (member.pseudo ?? "Invité")}
              </Text>
              {isOwner && !member.isCurrentUser ? (
                <Pressable
                  style={styles.removeButton}
                  onPress={() => onRemoveMember(member.user_id)}
                  disabled={removingMemberId === member.user_id}
                >
                  <Text style={styles.removeButtonText}>
                    {removingMemberId === member.user_id ? "…" : "Retirer"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </View>

      {!isOwner ? (
        <Pressable
          style={styles.leaveButton}
          onPress={onLeaveHousehold}
          disabled={leavingHousehold}
        >
          <Feather name="log-out" size={14} color={colors.danger} />
          <Text style={styles.leaveButtonText} numberOfLines={1}>
            {leavingHousehold ? "…" : "Quitter le foyer"}
          </Text>
        </Pressable>
      ) : null}
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
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inviteCodeText: {
    gap: 2,
  },
  inviteCodeValue: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.text,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  membersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberRowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  memberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  memberBadgeLetter: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 12,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  leaveButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 14,
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
