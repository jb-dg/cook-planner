import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import HouseholdContent from "@/components/profile/HouseholdContent";
import ProfileActionRow from "@/components/profile/ProfileActionRow";
import ProfileInfoContent from "@/components/profile/ProfileInfoContent";
import ProfileSlideModal from "@/components/profile/ProfileSlideModal";
import ProfileSplitView from "@/components/profile/ProfileSplitView";
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

          <Pressable
            onPress={state.handleEraseData}
            disabled={state.erasingData}
            style={styles.deleteAccountButton}
          >
            <Text style={styles.eraseDataText}>
              {state.erasingData
                ? "Effacement…"
                : "Effacer toutes mes données"}
            </Text>
          </Pressable>

          <Pressable
            onPress={state.handleDeleteAccount}
            disabled={state.deletingAccount}
            style={styles.deleteAccountButton}
          >
            <Text style={styles.deleteAccountText}>
              {state.deletingAccount
                ? "Suppression…"
                : "Supprimer mon compte"}
            </Text>
          </Pressable>
        </View>
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
