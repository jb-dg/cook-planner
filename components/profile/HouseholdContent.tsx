import { Text, TextInput, View } from "react-native";

import PhysicalButton from "@/components/PhysicalButton";
import HouseholdSummaryCard from "@/components/profile/HouseholdSummaryCard";
import type { useProfileScreenState } from "@/features/profile/hooks/useProfileScreenState";
import { styles } from "@/features/profile/screens/profileScreenStyles";

import type { HouseholdModalMode } from "./types";

type ProfileState = ReturnType<typeof useProfileScreenState>;

type Props = {
  mode: HouseholdModalMode;
  state: ProfileState;
};

// The "Créer / Rejoindre / Gérer un foyer" content, one of three modes.
// Shared by the phone's slide-up modal and the iPad split view's inline
// detail pane — HouseholdSummaryCard itself already took onOpenCreate/
// onOpenJoin callbacks instead of navigating directly, so it needed no
// changes to work inline here.
export default function HouseholdContent({ mode, state }: Props) {
  if (mode === "create") {
    return (
      <View style={styles.modalBlock}>
        {state.household ? (
          <>
            <Text style={styles.subheading}>Tu es déjà dans un foyer</Text>
            <Text style={styles.helper}>
              {`Tu fais partie du foyer "${state.household.name}". Quitte-le avant d'en créer un nouveau.`}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.subheading}>Créer un foyer</Text>
            <TextInput
              placeholder="Nom du foyer (ex: Famille Durand)"
              placeholderTextColor="#A5A58D"
              value={state.householdName}
              onChangeText={state.setHouseholdName}
              style={styles.input}
            />
            {state.householdError ? (
              <Text style={styles.errorText}>{state.householdError}</Text>
            ) : null}
            <PhysicalButton
              variant="secondary"
              onPress={state.handleCreateHousehold}
              disabled={state.creatingHousehold}
            >
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                {state.creatingHousehold ? "Création…" : "Créer"}
              </Text>
            </PhysicalButton>
          </>
        )}
      </View>
    );
  }

  if (mode === "join") {
    return (
      <View style={styles.modalBlock}>
        {state.household ? (
          <>
            <Text style={styles.subheading}>Tu es déjà dans un foyer</Text>
            <Text style={styles.helper}>
              {`Tu fais partie du foyer "${state.household.name}". Quitte-le avant d'en rejoindre un autre.`}
            </Text>
          </>
        ) : (
          <>
            {state.myInvites.length > 0 ? (
              <>
                <Text style={styles.subheading}>Invitations reçues</Text>
                {state.myInvites.map((invite) => (
                  <View key={invite.id} style={styles.inviteRow}>
                    <View style={styles.inviteRowText}>
                      <Text style={styles.helper} numberOfLines={2}>
                        {(invite.invited_by_pseudo ?? "Quelqu'un") +
                          " t'invite à rejoindre \"" +
                          invite.household_name +
                          "\""}
                      </Text>
                    </View>
                    <View style={styles.inviteRowActions}>
                      <PhysicalButton
                        variant="secondary"
                        onPress={() => state.handleDeclineInvite(invite)}
                        disabled={state.respondingInviteId === invite.id}
                      >
                        <Text style={styles.secondaryButtonText} numberOfLines={1}>
                          Refuser
                        </Text>
                      </PhysicalButton>
                      <PhysicalButton
                        onPress={() => state.handleAcceptInvite(invite)}
                        disabled={state.respondingInviteId === invite.id}
                      >
                        <Text style={styles.primaryButtonText} numberOfLines={1}>
                          {state.respondingInviteId === invite.id ? "…" : "Accepter"}
                        </Text>
                      </PhysicalButton>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
            <Text style={styles.subheading}>Rejoindre avec un code</Text>
            <Text style={styles.helper}>
              Demande à l'admin de te partager le code d'invitation de son foyer.
            </Text>
            <TextInput
              placeholder="Code d'invitation"
              placeholderTextColor="#A5A58D"
              value={state.joinCode}
              onChangeText={state.setJoinCode}
              style={styles.input}
              autoCapitalize="characters"
            />
            {state.joinError ? (
              <Text style={styles.errorText}>{state.joinError}</Text>
            ) : null}
            {state.joinSuccess ? (
              <Text style={styles.successText}>{state.joinSuccess}</Text>
            ) : null}
            <PhysicalButton onPress={state.handleJoinHousehold} disabled={state.joining}>
              <Text style={styles.primaryButtonText} numberOfLines={1}>
                {state.joining ? "Connexion…" : "Rejoindre"}
              </Text>
            </PhysicalButton>
          </>
        )}
      </View>
    );
  }

  // mode === "manage"
  if (!state.household) {
    return (
      <Text style={styles.helper}>
        {"Tu n'as pas encore de foyer actif. Utilise le bouton + pour en créer un."}
      </Text>
    );
  }

  return (
    <>
      <HouseholdSummaryCard
        loadingHousehold={state.loadingHousehold}
        household={state.household}
        householdMembers={state.householdMembers}
        householdError={state.householdError}
        isOwner={state.isOwner}
        removingMemberId={state.removingMemberId}
        leavingHousehold={state.leavingHousehold}
        onOpenCreate={() => state.openHouseholdModal("create")}
        onOpenJoin={() => state.openHouseholdModal("join")}
        onOpenManage={() => state.openHouseholdModal("manage")}
        onShareInviteCode={state.handleShareInviteCode}
        onRemoveMember={state.handleRemoveMember}
        onLeaveHousehold={state.handleLeaveHousehold}
      />
      {state.isOwner ? (
        <View style={styles.modalBlock}>
          <Text style={styles.subheading}>Inviter un membre</Text>
          <Text style={styles.helper}>
            Invite un proche par email, même s'il n'a pas encore de compte.
            L'invitation apparaîtra chez lui à sa prochaine connexion.
          </Text>
          <TextInput
            placeholder="Email du membre"
            placeholderTextColor="#A5A58D"
            value={state.inviteEmail}
            onChangeText={state.setInviteEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {state.inviteError ? (
            <Text style={styles.errorText}>{state.inviteError}</Text>
          ) : null}
          {state.inviteSuccess ? (
            <Text style={styles.successText}>{state.inviteSuccess}</Text>
          ) : null}
          <PhysicalButton
            variant="secondary"
            onPress={state.handleInviteMember}
            disabled={state.inviting}
          >
            <Text style={styles.secondaryButtonText} numberOfLines={1}>
              {state.inviting ? "Envoi…" : "Inviter"}
            </Text>
          </PhysicalButton>
          {state.sentInvites.length > 0 ? (
            <>
              <Text style={[styles.subheading, { marginTop: 12 }]}>
                Invitations en attente
              </Text>
              {state.sentInvites.map((invite) => (
                <View key={invite.id} style={styles.inviteRow}>
                  <Text style={styles.helper} numberOfLines={1}>
                    {invite.email}
                  </Text>
                  <PhysicalButton
                    variant="secondary"
                    onPress={() => state.handleCancelInvite(invite.id)}
                    disabled={state.cancelingInviteId === invite.id}
                  >
                    <Text style={styles.secondaryButtonText} numberOfLines={1}>
                      {state.cancelingInviteId === invite.id ? "…" : "Annuler"}
                    </Text>
                  </PhysicalButton>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
