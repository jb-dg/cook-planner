import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Image, Platform, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/Text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import HouseholdContent from "@/components/profile/HouseholdContent";
import HouseholdSummaryCard from "@/components/profile/HouseholdSummaryCard";
import ProfileActionRow from "@/components/profile/ProfileActionRow";
import ProfileInfoContent from "@/components/profile/ProfileInfoContent";
import ProfileSlideModal from "@/components/profile/ProfileSlideModal";
import ProfileSplitView from "@/components/profile/ProfileSplitView";
import SettingsSection from "@/components/profile/SettingsSection";
import { spacing } from "@/theme/design";

import { useProfileScreenState } from "../hooks/useProfileScreenState";
import { styles } from "./profileScreenStyles";

const isIpad = Platform.OS === "ios" && Platform.isPad;

export default function ProfileScreenView() {
  const state = useProfileScreenState();
  const insets = useSafeAreaInsets();

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

  if (isIpad) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ProfileSplitView state={state} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
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

        {/* Mon foyer — carte unique, adaptative selon qu'un foyer est déjà
            relié ou non. Remplace les anciennes lignes "Créer" / "Rejoindre"
            / "Gérer mes membres", qui restaient toutes affichées même une
            fois dans un foyer. */}
        <View>
          <View style={styles.sectionHeaderPlain}>
            <Text style={styles.sectionTitle}>Mon foyer</Text>
          </View>
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
        </View>

        <ProfileActionRow
          icon="settings"
          label="Mes informations"
          helper="Photo, pseudo et préférences"
          onPress={() => state.setProfileModalOpen(true)}
        />

        {/* Paramètres — sous-menu à part : session + suppression des
            données/du compte, à l'écart des actions foyer/profil. */}
        <ProfileActionRow
          icon="sliders"
          label="Paramètres"
          helper="Session, données et compte"
          onPress={() => state.setSettingsModalOpen(true)}
        />
      </ScrollView>

      <ProfileSlideModal
        visible={state.profileModalOpen}
        onClose={() => state.setProfileModalOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={profileModalContentStyle}
        title="Informations du profil"
      >
        <ProfileInfoContent state={state} />
      </ProfileSlideModal>

      <ProfileSlideModal
        visible={state.settingsModalOpen}
        onClose={() => state.setSettingsModalOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={profileModalContentStyle}
        title="Paramètres"
      >
        <SettingsSection
          onSignOut={state.handleSignOut}
          erasingData={state.erasingData}
          deletingAccount={state.deletingAccount}
          onEraseData={state.handleEraseData}
          onDeleteAccount={state.handleDeleteAccount}
          onOpenPrivacyPolicy={state.handleOpenPrivacyPolicy}
          onOpenSupport={state.handleOpenSupport}
        />
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
        <HouseholdContent mode={state.householdModalMode} state={state} />
      </ProfileSlideModal>
    </SafeAreaView>
  );
}
