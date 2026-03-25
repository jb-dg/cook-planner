import { Feather } from "@expo/vector-icons";
import type { PostgrestError } from "@supabase/supabase-js";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import HouseholdSummaryCard from "@/components/profile/HouseholdSummaryCard";
import ProfileActionRow from "@/components/profile/ProfileActionRow";
import ProfileSlideModal from "@/components/profile/ProfileSlideModal";
import type { Household, HouseholdModalMode, HouseholdMember, QuickActionItem } from "@/components/profile/types";
import PhysicalButton from "../../components/PhysicalButton";
import { useAuth } from "../../contexts/AuthContext";
import { ensureProfileRecord } from "../../lib/profile";
import { supabase } from "../../lib/supabase";
import { validateEmail } from "../../lib/validation/auth";
import { colors, layout, radii, spacing } from "../../theme/design";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [pseudo, setPseudo] = useState("");
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [pseudoSuccess, setPseudoSuccess] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingPseudo, setSavingPseudo] = useState(false);

  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>(
    [],
  );
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [householdError, setHouseholdError] = useState<string | null>(null);

  const [householdName, setHouseholdName] = useState("");
  const [creatingHousehold, setCreatingHousehold] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [joinPseudo, setJoinPseudo] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [householdActionsOpen, setHouseholdActionsOpen] = useState(false);
  const [householdModalMode, setHouseholdModalMode] =
    useState<HouseholdModalMode>("create");

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

  const isOwner = useMemo(
    () => household?.owner_id === session?.user.id,
    [household, session?.user.id],
  );

  const badgeLetter = useMemo(() => {
    const source = pseudo || session?.user.email || "Chef";
    return source.charAt(0).toUpperCase();
  }, [pseudo, session?.user.email]);

  const displayName = pseudo || session?.user.email?.split("@")[0] || "Chef";

  const openHouseholdModal = useCallback((mode: HouseholdModalMode) => {
    setHouseholdModalMode(mode);
    setHouseholdActionsOpen(true);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    setLoadingProfile(true);
    setPseudoError(null);
    setPseudoSuccess(null);
    try {
      const syncedPseudo = await ensureProfileRecord(session.user);
      setPseudo(syncedPseudo);
    } catch (err) {
      console.error("load profile", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [session]);

  const migrateOwnerDataToHousehold = useCallback(
    async (householdId: string) => {
      if (!session) return;
      try {
        const [recipesResult, menusResult] = await Promise.all([
          supabase
            .from("recipes")
            .update({ household_id: householdId })
            .eq("user_id", session.user.id)
            .is("household_id", null),
          supabase
            .from("weekly_menus")
            .update({ household_id: householdId })
            .eq("user_id", session.user.id)
            .is("household_id", null),
        ]);

        if (recipesResult.error) throw recipesResult.error;
        if (menusResult.error) throw menusResult.error;
      } catch (error) {
        console.warn("migrate owner data to household failed", error);
      }
    },
    [session],
  );

  const loadHousehold = useCallback(async () => {
    if (!session) return;
    setLoadingHousehold(true);
    setHouseholdError(null);
    try {
      const { data: membership, error: membershipError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (!membership?.household_id) {
        setHousehold(null);
        setHouseholdMembers([]);
        return;
      }

      const householdId = membership.household_id as string;

      const { data: householdData, error: householdFetchError } = await supabase
        .from("households")
        .select("id,name,owner_id")
        .eq("id", householdId)
        .single();

      if (householdFetchError) throw householdFetchError;

      setHousehold(householdData);

      if (householdData.owner_id === session.user.id) {
        await migrateOwnerDataToHousehold(householdId);
      }

      const { data: memberRows, error: memberError } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", householdId);

      if (memberError) throw memberError;

      const memberIds = memberRows?.map((row) => row.user_id) ?? [];

      if (memberIds.length === 0) {
        setHouseholdMembers([]);
        return;
      }

      type MemberProfileRow = {
        user_id: string;
        pseudo: string | null;
        email: string | null;
      };

      // Prefer RPC to bypass RLS limitations on profiles; fallback to direct select.
      let profileRows: MemberProfileRow[] = [];
      const { data: memberProfiles, error: memberProfilesError } =
        await supabase.rpc("fetch_household_member_profiles", {
          p_household_id: householdId,
        });

      if (!memberProfilesError && Array.isArray(memberProfiles)) {
        profileRows = memberProfiles as MemberProfileRow[];
      } else {
        const { data: fallbackProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id,pseudo,email")
          .in("user_id", memberIds);

        if (profileError) throw profileError;
        profileRows = fallbackProfiles ?? [];
      }

      const profileByUserId = new Map(
        profileRows.map((row) => [row.user_id, row]),
      );

      setHouseholdMembers(
        memberIds.map((userId) => {
          const profile = profileByUserId.get(userId);
          // fallback sur email local si pas de pseudo, puis null
          const resolvedPseudo =
            profile?.pseudo?.trim() ||
            profile?.email?.split("@")[0] ||
            null;
          return {
            user_id: userId,
            pseudo: resolvedPseudo,
            isCurrentUser: userId === session.user.id,
          };
        }),
      );
    } catch (err) {
      console.error("load household", err);
      setHousehold(null);
      setHouseholdMembers([]);
      setHouseholdError("Impossible de charger le foyer.");
    } finally {
      setLoadingHousehold(false);
    }
  }, [migrateOwnerDataToHousehold, session]);

  useEffect(() => {
    loadProfile();
    loadHousehold();
  }, [loadProfile, loadHousehold]);

  const handleSavePseudo = async () => {
    if (!session) return;
    const trimmed = pseudo.trim();
    if (trimmed.length < 3) {
      setPseudoError("Au moins 3 caractères.");
      return;
    }
    setPseudoError(null);
    setPseudoSuccess(null);
    setSavingPseudo(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: session.user.id,
          pseudo: trimmed,
          email: session.user.email?.trim().toLowerCase(),
        })
        .select("user_id")
        .single();

      if (error) {
        if ((error as PostgrestError).code === "23505") {
          setPseudoError("Ce pseudo est déjà pris.");
          return;
        }
        throw error;
      }

      setPseudo(trimmed);
      setPseudoSuccess("Pseudo mis à jour !");
    } catch (err) {
      console.error("update pseudo", err);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer le pseudo. Réessaie plus tard.",
      );
    } finally {
      setSavingPseudo(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!session) return;
    const trimmed = householdName.trim();
    if (!trimmed) {
      setHouseholdError("Renseigne un nom de foyer.");
      return;
    }
    setCreatingHousehold(true);
    setHouseholdError(null);
    try {
      if (household) {
        Alert.alert(
          "Déjà membre",
          "Tu fais déjà partie d'un foyer. Quitte-le avant d'en créer un nouveau.",
        );
        return;
      }
      const { data: newHousehold, error: createError } = await supabase
        .from("households")
        .insert({ name: trimmed, owner_id: session.user.id })
        .select("id,name,owner_id")
        .single();

      if (createError) throw createError;

      const { error: memberError } = await supabase
        .from("household_members")
        .insert({ household_id: newHousehold.id, user_id: session.user.id });

      if (memberError) throw memberError;

      await migrateOwnerDataToHousehold(newHousehold.id);

      setHouseholdName("");
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("create household", err);
      Alert.alert(
        "Erreur",
        "Impossible de créer le foyer. Réessaie plus tard.",
      );
    } finally {
      setCreatingHousehold(false);
    }
  };

  const handleInviteMember = async () => {
    if (!session || !household) return;
    if (!isOwner) {
      Alert.alert(
        "Action réservée",
        "Seul le créateur du foyer peut ajouter des membres.",
      );
      return;
    }
    const emailValidation = validateEmail(inviteEmail);
    if (emailValidation) {
      setInviteError(emailValidation);
      setInviteSuccess(null);
      return;
    }
    const normalizedEmail = inviteEmail.trim().toLowerCase();

    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      if (normalizedEmail === session.user.email?.trim().toLowerCase()) {
        setInviteError("Tu es déjà dans ce foyer.");
        return;
      }

      // Preferred path: secure server-side lookup from auth.users.
      let targetUserId: string | null = null;
      const { data: resolvedUserId, error: resolveError } = await supabase.rpc(
        "resolve_household_member_by_email",
        {
          p_household_id: household.id,
          p_email: normalizedEmail,
        },
      );

      if (!resolveError && typeof resolvedUserId === "string") {
        targetUserId = resolvedUserId;
      } else {
        // Fallback for environments where the SQL function isn't deployed yet.
        const { data: targetProfile, error: targetError } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (targetError) throw targetError;
        targetUserId = targetProfile?.user_id ?? null;
      }

      if (!targetUserId) {
        setInviteError(
          "Email introuvable. Vérifie l'adresse et exécute la migration SQL des invitations.",
        );
        return;
      }
      const { data: existingMembership, error: membershipLookupError } =
        await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", targetUserId)
          .maybeSingle();

      if (membershipLookupError) throw membershipLookupError;
      if (existingMembership) {
        setInviteError("Cet utilisateur appartient déjà à un foyer.");
        return;
      }

      const { error: inviteErrorRes } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: targetUserId,
        });

      if (inviteErrorRes) {
        if ((inviteErrorRes as PostgrestError).code === "23505") {
          setInviteError("Ce membre est déjà ajouté.");
          return;
        }
        throw inviteErrorRes;
      }

      // FIX: Crée un profil minimal pour le membre invité s'il n'en a pas encore,
      // afin qu'il ne s'affiche pas comme "Invité" dans la liste des membres.
      await supabase.from("profiles").upsert(
        {
          user_id: targetUserId,
          email: normalizedEmail,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );

      setInviteEmail("");
      setInviteSuccess("Membre ajouté au foyer !");
      await loadHousehold();
    } catch (err) {
      console.error("invite member", err);
      Alert.alert(
        "Erreur",
        "Impossible d'ajouter ce membre. Vérifie l'email et réessaie.",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!session) return;
    if (household) {
      setJoinError("Tu es déjà dans un foyer.");
      return;
    }
    const trimmed = joinPseudo.trim();
    if (trimmed.length < 3) {
      setJoinError("Renseigne le pseudo de l'admin du foyer.");
      return;
    }
    setJoinError(null);
    setJoinSuccess(null);
    setJoining(true);
    try {
      const { data: ownerProfile, error: ownerError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("pseudo", trimmed)
        .maybeSingle();

      if (ownerError) throw ownerError;
      if (!ownerProfile) {
        setJoinError("Aucun foyer associé à ce pseudo.");
        return;
      }

      const { data: ownerHousehold, error: householdErrorRes } = await supabase
        .from("households")
        .select("id")
        .eq("owner_id", ownerProfile.user_id)
        .maybeSingle();

      if (householdErrorRes) throw householdErrorRes;
      if (!ownerHousehold) {
        setJoinError("Cet utilisateur n'a pas de foyer actif.");
        return;
      }

      const { data: alreadyMember } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (alreadyMember) {
        setJoinError("Tu appartiens déjà à un foyer.");
        return;
      }

      const { error: joinInsertError } = await supabase
        .from("household_members")
        .insert({
          household_id: ownerHousehold.id,
          user_id: session.user.id,
        });

      if (joinInsertError) throw joinInsertError;

      setJoinPseudo("");
      setJoinSuccess("Demande acceptée ! Tu partages maintenant ce foyer.");
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("join household", err);
      Alert.alert(
        "Erreur",
        "Impossible de rejoindre le foyer. Vérifie le pseudo communiqué.",
      );
    } finally {
      setJoining(false);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      Alert.alert("Erreur", result.message ?? "Déconnexion impossible");
      return;
    }
    router.replace("/auth");
  };

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      {
        id: "profile",
        icon: "settings",
        label: "Mes Informations",
        helper: "Photo, pseudo et préférences",
        onPress: () => setProfileModalOpen(true),
      },
      {
        id: "household-create",
        icon: "home",
        label: "Créer un foyer",
        helper: "Pour démarrer un espace partagé",
        onPress: () => openHouseholdModal("create"),
      },
      {
        id: "household-join",
        icon: "link-2",
        label: "Rejoindre un foyer",
        helper: "Avec le pseudo de l'administrateur",
        onPress: () => openHouseholdModal("join"),
      },
      {
        id: "household-manage",
        icon: "users",
        label: "Gérer mes membres",
        helper: "Inviter, consulter ou retirer quelqu'un",
        onPress: () => openHouseholdModal("manage"),
      },
    ],
    [openHouseholdModal],
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
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{badgeLetter}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.helper}>Bonjour !</Text>
              <Text style={styles.heroGreeting}>{displayName}</Text>
              <Text style={styles.heroEmail}>{session?.user.email}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <Text style={styles.sectionDescription}>
            Connecte ou adapte ton foyer en quelques secondes.
          </Text>
          <View style={styles.actionList}>
            {quickActions.map((action) => (
              <ProfileActionRow key={action.id} {...action} />
            ))}
          </View>

          <PhysicalButtonAnimated variant="danger" onPress={handleSignOut}>
            <View style={styles.signOutInner}>
              <Feather name="log-out" size={16} color="#fff" />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </View>
          </PhysicalButtonAnimated>
        </View>
      </ScrollView>

      <ProfileSlideModal
        visible={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={profileModalContentStyle}
        title="Informations du profil"
      >
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
        <Text style={[styles.label, { marginTop: 16 }]}>Pseudo unique</Text>
        {loadingProfile ? (
          <ActivityIndicator color="#6B705C" />
        ) : (
          <>
            <TextInput
              placeholder="ex: chef_lucie"
              placeholderTextColor="#A5A58D"
              value={pseudo}
              onChangeText={setPseudo}
              style={styles.input}
              autoCapitalize="none"
            />
            <Text style={styles.helper}>
              Ce pseudo sert à rejoindre un foyer commun.
            </Text>
            {pseudoError ? <Text style={styles.errorText}>{pseudoError}</Text> : null}
            {pseudoSuccess ? (
              <Text style={styles.successText}>{pseudoSuccess}</Text>
            ) : null}
            <PhysicalButton onPress={handleSavePseudo} disabled={savingPseudo}>
              <Text style={styles.primaryButtonText}>
                {savingPseudo ? "Enregistrement…" : "Sauvegarder"}
              </Text>
            </PhysicalButton>
          </>
        )}
      </ProfileSlideModal>

      <ProfileSlideModal
        visible={householdActionsOpen}
        onClose={() => setHouseholdActionsOpen(false)}
        keyboardVerticalOffset={keyboardVerticalOffset}
        closeIconStyle={modalCloseIconStyle}
        contentContainerStyle={householdModalContentStyle}
        title="Ajouter ou rejoindre un foyer"
        automaticallyAdjustKeyboardInsets
      >
        {householdModalMode === "create" && (
          <View style={styles.modalBlock}>
            <Text style={styles.subheading}>Créer un foyer</Text>
            <TextInput
              placeholder="Nom du foyer (ex: Famille Durand)"
              placeholderTextColor="#A5A58D"
              value={householdName}
              onChangeText={setHouseholdName}
              style={styles.input}
            />
            {householdError ? <Text style={styles.errorText}>{householdError}</Text> : null}
            <Pressable
              style={[
                styles.secondaryButton,
                creatingHousehold && styles.buttonDisabled,
              ]}
              onPress={handleCreateHousehold}
              disabled={creatingHousehold}
            >
              <Text style={styles.secondaryButtonText}>
                {creatingHousehold ? "Création…" : "Créer"}
              </Text>
            </Pressable>
          </View>
        )}
        {householdModalMode === "join" && (
          <View style={styles.modalBlock}>
            <Text style={styles.subheading}>Rejoindre un foyer</Text>
            <Text style={styles.helper}>
              {
                "Demande à l'admin de te partager son pseudo, puis saisis-le ici."
              }
            </Text>
            <TextInput
              placeholder="Pseudo de l'administrateur"
              placeholderTextColor="#A5A58D"
              value={joinPseudo}
              onChangeText={setJoinPseudo}
              style={styles.input}
              autoCapitalize="none"
            />
            {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
            {joinSuccess ? <Text style={styles.successText}>{joinSuccess}</Text> : null}
            <PhysicalButton onPress={handleJoinHousehold} disabled={joining}>
              <Text style={styles.primaryButtonText}>
                {joining ? "Connexion…" : "Rejoindre"}
              </Text>
            </PhysicalButton>
          </View>
        )}
        {householdModalMode === "manage" && (
          <>
            {household ? (
              <>
                <HouseholdSummaryCard
                  loadingHousehold={loadingHousehold}
                  household={household}
                  householdMembers={householdMembers}
                  householdError={householdError}
                  isOwner={isOwner}
                  onOpenCreate={() => openHouseholdModal("create")}
                  onOpenJoin={() => openHouseholdModal("join")}
                  onOpenManage={() => openHouseholdModal("manage")}
                />
                {isOwner ? (
                  <View style={styles.modalBlock}>
                    <Text style={styles.subheading}>Ajouter un membre</Text>
                    <Text style={styles.helper}>
                      Invite un proche en indiquant son email de connexion.
                    </Text>
                    <TextInput
                      placeholder="Email du membre"
                      placeholderTextColor="#A5A58D"
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    {inviteError ? (
                      <Text style={styles.errorText}>{inviteError}</Text>
                    ) : null}
                    {inviteSuccess ? (
                      <Text style={styles.successText}>{inviteSuccess}</Text>
                    ) : null}
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        inviting && styles.buttonDisabled,
                      ]}
                      onPress={handleInviteMember}
                      disabled={inviting}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {inviting ? "Ajout…" : "Inviter"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.helper}>
                    {"Demande à l'admin de ton foyer actuel pour ajouter quelqu'un."}
                  </Text>
                )}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: 20,
    paddingBottom: 160,
  },
  containerWeb: {
    paddingTop: layout.webNavOffset + spacing.screen,
  },

  // Hero card
  heroCard: {
    borderRadius: 32,
    padding: spacing.screen,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // Section card
  section: {
    padding: spacing.screen,
    borderRadius: 28,
    gap: 14,
    backgroundColor: "rgb(255, 255, 255)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // Action list rows
  actionList: {
    gap: 10,
  },

  // Sign out inner layout (bg/shadow handled by PhysicalButton)
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

  // Modals
  modalCloseIcon: {
    position: "absolute",
    top: spacing.screen - 6,
    right: spacing.screen,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  // Secondary — outlined
  secondaryButton: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: "rgba(188, 108, 37, 0.06)",
  },
  secondaryButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
