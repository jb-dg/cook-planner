import type { PostgrestError } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Share } from "react-native";

import type {
  Household,
  HouseholdMember,
  HouseholdModalMode,
  PendingInvite,
  QuickActionItem,
  SentInvite,
} from "@/components/profile/types";
import { useAuth } from "@/contexts/AuthContext";
import { eraseUserData } from "@/lib/eraseUserData";
import { pickAndUploadImage } from "@/lib/mediaUpload";
import { ensureProfileRecord } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/validation/auth";

export const useProfileScreenState = () => {
  const router = useRouter();
  const { session, signOut, deleteAccount } = useAuth();

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

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [loadingSentInvites, setLoadingSentInvites] = useState(false);
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);

  const [myInvites, setMyInvites] = useState<PendingInvite[]>([]);
  const [loadingMyInvites, setLoadingMyInvites] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

  const [leavingHousehold, setLeavingHousehold] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [deletingAccount, setDeletingAccount] = useState(false);
  const [erasingData, setErasingData] = useState(false);

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
        .select("id,name,owner_id,invite_code")
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

  const loadMyInvites = useCallback(async () => {
    if (!session) return;
    setLoadingMyInvites(true);
    try {
      const { data, error } = await supabase.rpc("fetch_my_pending_invites");
      if (error) throw error;
      setMyInvites((data as PendingInvite[]) ?? []);
    } catch (err) {
      console.error("load my invites", err);
    } finally {
      setLoadingMyInvites(false);
    }
  }, [session]);

  const loadSentInvites = useCallback(
    async (householdId: string) => {
      setLoadingSentInvites(true);
      try {
        const { data, error } = await supabase
          .from("household_invites")
          .select("id,email,created_at")
          .eq("household_id", householdId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSentInvites(data ?? []);
      } catch (err) {
        console.error("load sent invites", err);
      } finally {
        setLoadingSentInvites(false);
      }
    },
    [],
  );

  const openHouseholdModal = useCallback(
    (mode: HouseholdModalMode) => {
      setHouseholdModalMode(mode);
      setHouseholdActionsOpen(true);
      if (mode === "join") {
        // Refetch so an invite received while the app was already open shows up.
        loadMyInvites();
      }
    },
    [loadMyInvites],
  );

  useEffect(() => {
    loadProfile();
    loadHousehold();
    loadMyInvites();
  }, [loadProfile, loadHousehold, loadMyInvites]);

  useEffect(() => {
    if (household && isOwner) {
      loadSentInvites(household.id);
    } else {
      setSentInvites([]);
    }
  }, [household, isOwner, loadSentInvites]);

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
        .select("id,name,owner_id,invite_code")
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

      const { error: inviteErrorRes } = await supabase
        .from("household_invites")
        .insert({
          household_id: household.id,
          invited_by: session.user.id,
          email: normalizedEmail,
        });

      if (inviteErrorRes) {
        if ((inviteErrorRes as PostgrestError).code === "23505") {
          setInviteError("Une invitation est déjà en attente pour cet email.");
          return;
        }
        throw inviteErrorRes;
      }

      setInviteEmail("");
      setInviteSuccess(
        "Invitation envoyée ! Elle apparaîtra chez ce membre à sa prochaine connexion.",
      );
      await loadSentInvites(household.id);
    } catch (err) {
      console.error("invite member", err);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer cette invitation. Vérifie l'email et réessaie.",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!household) return;
    setCancelingInviteId(inviteId);
    try {
      const { error } = await supabase
        .from("household_invites")
        .update({ status: "cancelled", responded_at: new Date().toISOString() })
        .eq("id", inviteId);

      if (error) throw error;
      await loadSentInvites(household.id);
    } catch (err) {
      console.error("cancel invite", err);
      Alert.alert("Erreur", "Impossible d'annuler cette invitation.");
    } finally {
      setCancelingInviteId(null);
    }
  };

  const handleAcceptInvite = async (invite: PendingInvite) => {
    if (!session) return;
    if (household) {
      setJoinError("Tu appartiens déjà à un foyer.");
      return;
    }
    setRespondingInviteId(invite.id);
    try {
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({ household_id: invite.household_id, user_id: session.user.id });

      if (memberError) {
        if ((memberError as PostgrestError).code === "23505") {
          Alert.alert("Déjà membre", "Tu appartiens déjà à un foyer.");
        } else {
          throw memberError;
        }
      } else {
        await supabase
          .from("household_invites")
          .update({
            status: "accepted",
            accepted_user_id: session.user.id,
            responded_at: new Date().toISOString(),
          })
          .eq("id", invite.id);
      }

      await Promise.all([loadHousehold(), loadMyInvites()]);
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("accept invite", err);
      Alert.alert("Erreur", "Impossible de rejoindre ce foyer. Réessaie plus tard.");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleDeclineInvite = async (invite: PendingInvite) => {
    setRespondingInviteId(invite.id);
    try {
      const { error } = await supabase
        .from("household_invites")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", invite.id);

      if (error) throw error;
      await loadMyInvites();
    } catch (err) {
      console.error("decline invite", err);
      Alert.alert("Erreur", "Impossible de refuser cette invitation.");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleShareInviteCode = async () => {
    if (!household) return;
    try {
      await Share.share({
        message: `Rejoins notre foyer "${household.name}" sur CookPlanner ! Code d'invitation : ${household.invite_code}`,
      });
    } catch (err) {
      console.error("share invite code", err);
    }
  };

  const deleteHousehold = async () => {
    if (!household) return;
    setLeavingHousehold(true);
    try {
      const { error } = await supabase.from("households").delete().eq("id", household.id);
      if (error) throw error;
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("delete household", err);
      Alert.alert("Erreur", "Impossible de supprimer le foyer. Réessaie plus tard.");
    } finally {
      setLeavingHousehold(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!session || !household) return;
    if (isOwner && householdMembers.length > 1) {
      Alert.alert(
        "Action impossible",
        "En tant qu'administrateur, retire d'abord tous les autres membres avant de quitter le foyer.",
      );
      return;
    }

    if (isOwner) {
      Alert.alert(
        "Supprimer le foyer ?",
        `"${household.name}" sera définitivement supprimé. Tes recettes et ton planning resteront disponibles en solo.`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: () => void deleteHousehold() },
        ],
      );
      return;
    }

    setLeavingHousehold(true);
    try {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", household.id)
        .eq("user_id", session.user.id);

      if (error) throw error;
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("leave household", err);
      Alert.alert("Erreur", "Impossible de quitter le foyer. Réessaie plus tard.");
    } finally {
      setLeavingHousehold(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!household || !isOwner) return;
    setRemovingMemberId(memberUserId);
    try {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", household.id)
        .eq("user_id", memberUserId);

      if (error) throw error;
      await loadHousehold();
    } catch (err) {
      console.error("remove member", err);
      Alert.alert("Erreur", "Impossible de retirer ce membre. Réessaie plus tard.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleJoinHousehold = async () => {
    if (!session) return;
    if (household) {
      setJoinError("Tu es déjà dans un foyer.");
      return;
    }
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      setJoinError("Renseigne le code d'invitation du foyer.");
      return;
    }
    setJoinError(null);
    setJoinSuccess(null);
    setJoining(true);
    try {
      const { data: resolvedHouseholds, error: resolveError } = await supabase.rpc(
        "resolve_household_by_invite_code",
        { p_code: trimmed },
      );

      if (resolveError) throw resolveError;
      const ownerHousehold = resolvedHouseholds?.[0];
      if (!ownerHousehold) {
        setJoinError("Aucun foyer associé à ce code.");
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

      setJoinCode("");
      setJoinSuccess("Tu partages maintenant ce foyer !");
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("join household", err);
      Alert.alert(
        "Erreur",
        "Impossible de rejoindre le foyer. Vérifie le code communiqué.",
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

  const runDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        Alert.alert(
          "Erreur",
          result.message ?? "Impossible de supprimer le compte.",
        );
        return;
      }
      router.replace("/auth");
    } finally {
      setDeletingAccount(false);
    }
  };

  const runEraseData = async () => {
    if (!session) return;
    setErasingData(true);
    try {
      const result = await eraseUserData(session.user.id);
      if (!result.success) {
        Alert.alert(
          "Erreur",
          result.message ?? "Impossible d'effacer les données.",
        );
        return;
      }
      await Promise.all([loadProfile(), loadHousehold(), loadMyInvites()]);
      Alert.alert(
        "Données effacées",
        "Tes recettes, ton planning, ta liste de courses et ton foyer ont été supprimés. Ton compte reste actif.",
      );
    } finally {
      setErasingData(false);
    }
  };

  const handleEraseData = () => {
    if (erasingData) return;
    Alert.alert(
      "Effacer toutes mes données ?",
      "Recettes, planning, liste de courses et foyer seront définitivement supprimés. Ton compte et ton identifiant sont conservés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmer l'effacement",
              "Cette action est irréversible.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Tout effacer",
                  style: "destructive",
                  onPress: () => void runEraseData(),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    if (deletingAccount) return;
    Alert.alert(
      "Supprimer mon compte ?",
      "Cette action est définitive. Toutes tes recettes, ton planning, ta liste de courses et ton foyer seront supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmer la suppression",
              "Dernière étape : ton compte et toutes tes données seront effacés immédiatement.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer définitivement",
                  style: "destructive",
                  onPress: () => void runDeleteAccount(),
                },
              ],
            );
          },
        },
      ],
    );
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
        helper: "Avec le code d'invitation",
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
    joinCode,
    joinError,
    joinSuccess,
    joining,
    sentInvites,
    loadingSentInvites,
    cancelingInviteId,
    myInvites,
    loadingMyInvites,
    respondingInviteId,
    leavingHousehold,
    removingMemberId,
    deletingAccount,
    erasingData,
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
    setJoinCode,
    setProfileModalOpen,
    setHouseholdActionsOpen,
    handleSavePseudo,
    handlePickAvatar,
    handleCreateHousehold,
    handleInviteMember,
    handleCancelInvite,
    handleJoinHousehold,
    handleAcceptInvite,
    handleDeclineInvite,
    handleShareInviteCode,
    handleLeaveHousehold,
    handleRemoveMember,
    handleSignOut,
    handleEraseData,
    handleDeleteAccount,
    openHouseholdModal,
  };
};
