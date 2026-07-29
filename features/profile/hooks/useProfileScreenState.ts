import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import type {
  Household,
  HouseholdMember,
  HouseholdModalMode,
  QuickActionItem,
} from "@/components/profile/types";
import { useAuth } from "@/contexts/AuthContext";
import { pickAndUploadImage } from "@/lib/mediaUpload";
import { ensureProfileRecord } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/validation/auth";

export const useProfileScreenState = () => {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const [pseudo, setPseudo] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [pseudoSuccess, setPseudoSuccess] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingPseudo, setSavingPseudo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      const { data: profile, error: avatarError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (avatarError) {
        if ((avatarError as PostgrestError).code === "42703") {
          setAvatarUrl("");
        } else {
          throw avatarError;
        }
      } else {
        setAvatarUrl(profile?.avatar_url ?? "");
      }
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
          const resolvedPseudo =
            profile?.pseudo?.trim() || profile?.email?.split("@")[0] || null;
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

  const handlePickAvatar = async () => {
    if (!session || uploadingAvatar) return;
    setUploadingAvatar(true);
    setPseudoSuccess(null);
    setPseudoError(null);
    try {
      const url = await pickAndUploadImage({
        pathPrefix: `profiles/${session.user.id}`,
        fileNamePrefix: "avatar",
        aspect: [1, 1],
      });

      if (!url) return;

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", session.user.id);

      if (error) throw error;

      setAvatarUrl(url);
      setPseudoSuccess("Photo de profil mise à jour !");
    } catch (err) {
      console.error("upload avatar", err);
      if (err instanceof Error && err.message === "media-bucket-not-found") {
        Alert.alert(
          "Migration Supabase requise",
          "Le bucket media n'existe pas encore. Applique la migration Supabase puis réessaie.",
        );
        return;
      }
      Alert.alert(
        "Erreur",
        "Impossible d'ajouter cette photo. Vérifie les permissions et réessaie.",
      );
    } finally {
      setUploadingAvatar(false);
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

  return {
    session,
    pseudo,
    avatarUrl,
    pseudoError,
    pseudoSuccess,
    loadingProfile,
    savingPseudo,
    uploadingAvatar,
    household,
    householdMembers,
    loadingHousehold,
    householdError,
    householdName,
    creatingHousehold,
    inviteEmail,
    inviteError,
    inviteSuccess,
    inviting,
    joinPseudo,
    joinError,
    joinSuccess,
    joining,
    profileModalOpen,
    householdActionsOpen,
    householdModalMode,
    isOwner,
    badgeLetter,
    displayName,
    quickActions,
    setPseudo,
    setHouseholdName,
    setInviteEmail,
    setJoinPseudo,
    setProfileModalOpen,
    setHouseholdActionsOpen,
    handleSavePseudo,
    handlePickAvatar,
    handleCreateHousehold,
    handleInviteMember,
    handleJoinHousehold,
    handleSignOut,
    openHouseholdModal,
  };
};
