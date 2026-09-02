import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import HouseholdContent from "@/components/profile/HouseholdContent";
import ProfileActionRow from "@/components/profile/ProfileActionRow";
import ProfileInfoContent from "@/components/profile/ProfileInfoContent";
import type { HouseholdModalMode } from "@/components/profile/types";
import type { useProfileScreenState } from "@/features/profile/hooks/useProfileScreenState";
import { styles as sharedStyles } from "@/features/profile/screens/profileScreenStyles";
import { colors, spacing } from "@/theme/design";

type ProfileState = ReturnType<typeof useProfileScreenState>;

type SelectedSection =
  | "profile"
  | "household-create"
  | "household-join"
  | "household-manage";

const SECTION_TITLES: Record<SelectedSection, string> = {
  profile: "Mes informations",
  "household-create": "Créer un foyer",
  "household-join": "Rejoindre un foyer",
  "household-manage": "Gérer mon foyer",
};

const SECTION_HOUSEHOLD_MODE: Partial<Record<SelectedSection, HouseholdModalMode>> = {
  "household-create": "create",
  "household-join": "join",
  "household-manage": "manage",
};

type Props = {
  state: ProfileState;
};

// iPad only (portrait and landscape): the quick actions that open a
// full-screen modal on phone instead select which content shows in the
// right pane — no navigation away from the screen at all.
export default function ProfileSplitView({ state }: Props) {
  const [selected, setSelected] = useState<SelectedSection>("household-manage");

  const menuActions = state.quickActions.map((action) => ({
    ...action,
    active: selected === action.id,
    onPress: () => setSelected(action.id as SelectedSection),
  }));

  const householdMode = SECTION_HOUSEHOLD_MODE[selected];

  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
        >
          <View style={sharedStyles.heroCard}>
            <View style={sharedStyles.heroHeader}>
              <Pressable
                style={sharedStyles.avatar}
                onPress={state.handlePickAvatar}
                disabled={state.uploadingAvatar}
              >
                {state.avatarUrl ? (
                  <Image
                    source={{ uri: state.avatarUrl }}
                    style={sharedStyles.avatarImage}
                  />
                ) : (
                  <Text style={sharedStyles.avatarLetter}>{state.badgeLetter}</Text>
                )}
              </Pressable>
              <View style={sharedStyles.heroText}>
                <Text style={sharedStyles.helper}>Bonjour !</Text>
                <Text style={sharedStyles.heroGreeting} numberOfLines={1}>
                  {state.displayName}
                </Text>
                <Text style={sharedStyles.heroEmail} numberOfLines={1}>
                  {state.session?.user.email}
                </Text>
              </View>
            </View>
          </View>

          <View style={sharedStyles.section}>
            <Text style={sharedStyles.sectionTitle}>Actions rapides</Text>
            <Text style={sharedStyles.sectionDescription}>
              Connecte ou adapte ton foyer en quelques secondes.
            </Text>
            <View style={sharedStyles.actionList}>
              {menuActions.map((action) => (
                <ProfileActionRow key={action.id} {...action} />
              ))}
            </View>
          </View>

          <PhysicalButtonAnimated variant="danger" onPress={state.handleSignOut}>
            <View style={sharedStyles.signOutInner}>
              <Feather name="log-out" size={16} color="#fff" />
              <Text style={sharedStyles.signOutText}>Se déconnecter</Text>
            </View>
          </PhysicalButtonAnimated>

          <Pressable
            onPress={state.handleEraseData}
            disabled={state.erasingData}
            style={sharedStyles.deleteAccountButton}
          >
            <Text style={sharedStyles.eraseDataText}>
              {state.erasingData
                ? "Effacement…"
                : "Effacer toutes mes données"}
            </Text>
          </Pressable>

          <Pressable
            onPress={state.handleDeleteAccount}
            disabled={state.deletingAccount}
            style={sharedStyles.deleteAccountButton}
          >
            <Text style={sharedStyles.deleteAccountText}>
              {state.deletingAccount ? "Suppression…" : "Supprimer mon compte"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.detail}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.detailHeading}>{SECTION_TITLES[selected]}</Text>
          {selected === "profile" ? (
            <ProfileInfoContent state={state} />
          ) : (
            <HouseholdContent mode={householdMode ?? "manage"} state={state} />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  panel: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  panelContent: {
    padding: spacing.screen * 0.8,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 1.5,
  },
  detail: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.screen,
    paddingBottom: spacing.screen * 2,
    gap: 16,
  },
  detailHeading: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.3,
  },
});
