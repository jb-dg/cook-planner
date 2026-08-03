import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import PhysicalButton from "@/components/PhysicalButton";
import WebFooter from "@/components/WebFooter";
import HouseholdSummaryCard from "@/components/profile/HouseholdSummaryCard";
import ProfileActionRow from "@/components/profile/ProfileActionRow";
import ProfileSlideModal from "@/components/profile/ProfileSlideModal";
import { spacing } from "@/theme/design";

import { useProfileScreenState } from "../hooks/useProfileScreenState";
import { styles } from "./profileScreenStyles";

type Props = {
  variant: "web" | "native";
};

export default function ProfileScreenView({ variant }: Props) {
  const state = useProfileScreenState();
  const insets = useSafeAreaInsets();
  const isWeb = variant === "web";

  const profileModalContentStyle = useMemo(
    () => [
      styles.modalContent,
      {
        paddingTop: spacing.screen + insets.top + 16,
        paddingBottom: Math.max(120, insets.bottom + 120),
      },
    ],
    [insets.bottom, insets.top],
  );

  const householdModalContentStyle = useMemo(
    () => [
      styles.modalContent,
      styles.householdModalContent,
      {
        paddingTop: spacing.screen + insets.top + 16,
        paddingBottom: Math.max(220, insets.bottom + 220),
      },
    ],
    [insets.bottom, insets.top],
  );

  const modalCloseIconStyle = useMemo(
    () => [
      styles.modalCloseIcon,
      { top: insets.top + spacing.base, right: spacing.screen },
    ],
    [insets.top],
  );

  const keyboardVerticalOffset = useMemo(
    () => insets.top + spacing.base,
    [insets.top],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[styles.container, isWeb && styles.containerWeb]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["rgb(255, 255, 255)", "rgb(255, 255, 255)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Pressable
              style={styles.avatar}
              onPress={state.handlePickAvatar}
              disabled={state.uploadingAvatar}
            >
              {state.avatarUrl ? (
                <Image source={{ uri: state.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarLetter}>{state.badgeLetter}</Text>
              )}
            </Pressable>
            <View style={styles.heroText}>
              <Text style={styles.helper}>Bonjour !</Text>
              <Text style={styles.heroGreeting}>{state.displayName}</Text>
              <Text style={styles.heroEmail}>{state.session?.user.email}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <Text style={styles.sectionDescription}>
            Connecte ou adapte ton foyer en quelques secondes.
          </Text>
          <View style={styles.actionList}>
            {state.quickActions.map((action) => (
              <ProfileActionRow key={action.id} {...action} />
            ))}
          </View>

          <PhysicalButtonAnimated variant="danger" onPress={state.handleSignOut}>
            <View style={styles.signOutInner}>
              <Feather name="log-out" size={16} color="#fff" />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </View>
          </PhysicalButtonAnimated>
        </View>

        {isWeb && <WebFooter />}
      </ScrollView>

      <ProfileSlideModal
        visible={state.profileModalOpen}
        onClose={() => state.setProfileModalOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={profileModalContentStyle}
        title="Informations du profil"
      >
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{state.session?.user.email}</Text>
        <Text style={[styles.label, { marginTop: 16 }]}>Photo</Text>
        <View style={styles.avatarEditorRow}>
          <View style={styles.avatarEditorPreview}>
            {state.avatarUrl ? (
              <Image
                source={{ uri: state.avatarUrl }}
                style={styles.avatarEditorImage}
              />
            ) : (
              <Text style={styles.avatarEditorLetter}>{state.badgeLetter}</Text>
            )}
          </View>
          <View style={styles.avatarUploadButton}>
            <PhysicalButton
              variant="secondary"
              onPress={state.handlePickAvatar}
              disabled={state.uploadingAvatar}
            >
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                {state.uploadingAvatar ? "Upload..." : "Choisir une photo"}
              </Text>
            </PhysicalButton>
          </View>
        </View>
        <Text style={[styles.label, { marginTop: 16 }]}>Pseudo unique</Text>
        {state.loadingProfile ? (
          <ActivityIndicator color="#6B705C" />
        ) : (
          <>
            <TextInput
              placeholder="ex: chef_lucie"
              placeholderTextColor="#A5A58D"
              value={state.pseudo}
              onChangeText={state.setPseudo}
              style={styles.input}
              autoCapitalize="none"
            />
            <Text style={styles.helper}>
              Ce pseudo sert à rejoindre un foyer commun.
            </Text>
            {state.pseudoError ? (
              <Text style={styles.errorText}>{state.pseudoError}</Text>
            ) : null}
            {state.pseudoSuccess ? (
              <Text style={styles.successText}>{state.pseudoSuccess}</Text>
            ) : null}
            <PhysicalButton
              onPress={state.handleSavePseudo}
              disabled={state.savingPseudo}
            >
              <Text style={styles.primaryButtonText} numberOfLines={1}>
                {state.savingPseudo ? "Enregistrement…" : "Sauvegarder"}
              </Text>
            </PhysicalButton>
          </>
        )}
      </ProfileSlideModal>

      <ProfileSlideModal
        visible={state.householdActionsOpen}
        onClose={() => state.setHouseholdActionsOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={householdModalContentStyle}
        title="Ajouter ou rejoindre un foyer"
        automaticallyAdjustKeyboardInsets
      >
        {state.householdModalMode === "create" && (
          <View style={styles.modalBlock}>
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
          </View>
        )}
        {state.householdModalMode === "join" && (
          <View style={styles.modalBlock}>
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
                          {state.respondingInviteId === invite.id
                            ? "…"
                            : "Accepter"}
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
          </View>
        )}
        {state.householdModalMode === "manage" && (
          <>
            {state.household ? (
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
                                {state.cancelingInviteId === invite.id
                                  ? "…"
                                  : "Annuler"}
                              </Text>
                            </PhysicalButton>
                          </View>
                        ))}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.helper}>
                {"Tu n'as pas encore de foyer actif. Utilise le bouton + pour en créer un."}
              </Text>
            )}
          </>
        )}
      </ProfileSlideModal>
    </SafeAreaView>
  );
}
