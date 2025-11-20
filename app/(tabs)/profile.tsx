import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PostgrestError } from "@supabase/supabase-js";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { validateEmail } from "../../lib/validation/auth";
import { colors, radii, spacing } from "../../theme/design";

type Household = {
  id: string;
  name: string;
  owner_id: string;
};

type HouseholdMember = {
  user_id: string;
  pseudo: string | null;
  isCurrentUser: boolean;
};

type HouseholdModalMode = "create" | "join" | "manage";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [pseudoSuccess, setPseudoSuccess] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingPseudo, setSavingPseudo] = useState(false);

  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>(
    []
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [householdActionsOpen, setHouseholdActionsOpen] = useState(false);
  const [householdModalMode, setHouseholdModalMode] =
    useState<HouseholdModalMode>("create");
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  const isOwner = useMemo(
    () => household?.owner_id === session?.user.id,
    [household, session?.user.id]
  );

  const badgeLetter = useMemo(() => {
    const source = pseudo || session?.user.email || "Chef";
    return source.charAt(0).toUpperCase();
  }, [pseudo, session?.user.email]);

  const displayName = pseudo || session?.user.email?.split("@")[0] || "Chef";

  const quickActions: {
    label: string;
    helper: string;
    icon: FeatherIconName;
    action: () => void;
  }[] = [
    {
      label: "Mes recettes",
      helper: "Retrouve tes créations favorites",
      icon: "book-open",
      action: () => router.push("/(tabs)/recipes"),
    },
    {
      label: "Planning du foyer",
      helper: "Consulte le planning partagé",
      icon: "calendar",
      action: () => router.push("/(tabs)/planner"),
    },
    {
      label: "Courses partagées",
      helper: "Synchronise les listes à venir",
      icon: "shopping-bag",
      action: () =>
        Alert.alert(
          "Bientôt disponible",
          "Les listes de courses partagées arrivent bientôt."
        ),
    },
  ];

  const heroSubtitle = household
    ? `${household.name} - ${householdMembers.length} membre${
        householdMembers.length > 1 ? "s" : ""
      } connecté${householdMembers.length > 1 ? "s" : ""}`
    : "Crée ton foyer pour planifier ensemble";

  const profileStats = useMemo(
    () => [
      {
        label: "Foyer",
        value: household?.name ?? "Solo",
      },
      {
        label: "Rôle",
        value: household ? (isOwner ? "Admin" : "Membre") : "Individuel",
      },
      {
        label: "Participants",
        value: household ? `${householdMembers.length}` : "0",
      },
    ],
    [household?.name, householdMembers.length, isOwner]
  );

  const openHouseholdModal = (mode: HouseholdModalMode) => {
    setHouseholdModalMode(mode);
    setHouseholdActionsOpen(true);
    setFabMenuOpen(false);
  };

  const generateDefaultPseudo = useCallback(() => {
    const rawSource =
      session?.user.email?.split("@")[0] ??
      session?.user.user_metadata?.full_name ??
      "chef";
    const sanitized = rawSource
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    if (sanitized.length >= 3) return sanitized.slice(0, 24);
    const fallback = `chef${session?.user.id.slice(0, 5) ?? ""}`.toLowerCase();
    return fallback;
  }, [session]);

  const ensureDefaultPseudo = useCallback(async () => {
    if (!session) return "";
    const base = generateDefaultPseudo();
    let candidate = base;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          user_id: session.user.id,
          pseudo: candidate,
          email: session.user.email?.toLowerCase(),
        })
        .select("pseudo")
        .single();

      if (!error && data?.pseudo) {
        return data.pseudo;
      }

      if ((error as PostgrestError).code !== "23505") {
        throw error;
      }

      candidate = `${base}${Math.floor(Math.random() * 900 + 100)}`;
    }
    return base;
  }, [generateDefaultPseudo, session]);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    setLoadingProfile(true);
    setPseudoError(null);
    setPseudoSuccess(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("pseudo")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.pseudo) {
        const autoPseudo = await ensureDefaultPseudo();
        setPseudo(autoPseudo);
        return;
      }
      setPseudo(data.pseudo);
    } catch (err) {
      console.error("load profile", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [ensureDefaultPseudo, session]);

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

      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("user_id,pseudo")
        .in("user_id", memberIds);

      if (profileError) throw profileError;

      setHouseholdMembers(
        memberIds.map((userId) => ({
          user_id: userId,
          pseudo:
            profileRows?.find((profile) => profile.user_id === userId)
              ?.pseudo ?? null,
          isCurrentUser: userId === session.user.id,
        }))
      );
    } catch (err) {
      console.error("load household", err);
      setHousehold(null);
      setHouseholdMembers([]);
      setHouseholdError("Impossible de charger le foyer.");
    } finally {
      setLoadingHousehold(false);
    }
  }, [session]);

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
          email: session.user.email?.toLowerCase(),
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
        "Impossible d'enregistrer le pseudo. Réessaie plus tard."
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
          "Tu fais déjà partie d'un foyer. Quitte-le avant d'en créer un nouveau."
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

      setHouseholdName("");
      await loadHousehold();
      setHouseholdActionsOpen(false);
    } catch (err) {
      console.error("create household", err);
      Alert.alert(
        "Erreur",
        "Impossible de créer le foyer. Réessaie plus tard."
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
        "Seul le créateur du foyer peut ajouter des membres."
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
      if (normalizedEmail === session.user.email?.toLowerCase()) {
        setInviteError("Tu es déjà dans ce foyer.");
        return;
      }
      const { data: targetProfile, error: targetError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (targetError) throw targetError;
      if (!targetProfile) {
        setInviteError("Aucun utilisateur avec cet email.");
        return;
      }
      const { data: existingMembership, error: membershipLookupError } =
        await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", targetProfile.user_id)
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
          user_id: targetProfile.user_id,
        });

      if (inviteErrorRes) {
        if ((inviteErrorRes as PostgrestError).code === "23505") {
          setInviteError("Ce membre est déjà ajouté.");
          return;
        }
        throw inviteErrorRes;
      }

      setInviteEmail("");
      setInviteSuccess("Membre ajouté au foyer !");
      await loadHousehold();
    } catch (err) {
      console.error("invite member", err);
      Alert.alert(
        "Erreur",
        "Impossible d'ajouter ce membre. Vérifie l'email et réessaie."
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
        "Impossible de rejoindre le foyer. Vérifie le pseudo communiqué."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.success) {
      Alert.alert("Erreur", result.message ?? "Déconnexion impossible");
    }
  };

  const renderHouseholdSummary = () => {
    if (loadingHousehold) {
      return (
        <View style={styles.householdCard}>
          <ActivityIndicator color={colors.accentSecondary} />
        </View>
      );
    }

    if (!household) {
      return (
        <View style={[styles.householdCard, styles.householdCardEmpty]}>
          <Text style={styles.householdName}>Aucun foyer relié</Text>
          <Text style={styles.helper}>
            Utilise les actions ci-dessous pour créer ou rejoindre un foyer
            partagé.
          </Text>
          <View style={styles.householdActions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => openHouseholdModal("create")}
            >
              <Text style={styles.secondaryButtonText}>Créer un foyer</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => openHouseholdModal("join")}
            >
              <Text style={styles.secondaryButtonText}>Rejoindre</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.householdCard}>
        <View style={styles.householdHeader}>
          <View>
            <Text style={styles.householdLabel}>Foyer actif</Text>
            <Text style={styles.householdName}>{household.name}</Text>
          </View>
          <View style={styles.householdBadges}>
            <Text style={styles.statusPill}>
              {isOwner ? "Admin" : "Membre"}
            </Text>
            <Text style={styles.statusPill}>
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
            <Text style={styles.helper}>Aucun membre pour l'instant.</Text>
          ) : (
            householdMembers.map((member) => (
              <View key={member.user_id} style={styles.memberBadge}>
                <Text style={styles.memberBadgeLetter}>
                  {(member.pseudo ?? "?").charAt(0).toUpperCase()}
                </Text>
                <Text style={styles.memberBadgeLabel}>
                  {member.isCurrentUser ? "Moi" : member.pseudo ?? "Invité"}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
        <Pressable
          style={styles.manageButton}
          onPress={() => openHouseholdModal("manage")}
        >
          <Text style={styles.manageButtonText}>
            {isOwner ? "Gérer le foyer" : "Voir les membres"}
          </Text>
        </Pressable>
        {householdError ? (
          <Text style={styles.errorText}>{householdError}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#ffffffff", "#ffffffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{badgeLetter}</Text>
              <View style={styles.avatarEdit}>
                <Feather name="edit-3" size={14} color={colors.text} />
              </View>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.helper}>Bonjour !</Text>
              <Text style={styles.heroGreeting}>{displayName}</Text>
              <Text style={styles.heroEmail}>{session?.user.email}</Text>
            </View>
          </View>
          {/* <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
          <View style={styles.heroStats}>
            {profileStats.map((stat) => (
              <View key={stat.label} style={styles.statPill}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View> */}
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raccourcis du quotidien</Text>
          <Text style={styles.sectionDescription}>
            Pilote les outils que tu utilises le plus.
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={styles.quickActionCard}
                onPress={action.action}
              >
                <View style={styles.quickActionIcon}>
                  <Feather name={action.icon} size={18} color="#fff" />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionHelper}>{action.helper}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vie du foyer</Text>
          <Text style={styles.sectionDescription}>
            Organise la cuisine partagée et invite des proches.
          </Text>
          {renderHouseholdSummary()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <Text style={styles.sectionDescription}>
            Connecte ou adapte ton foyer en quelques secondes.
          </Text>
          <View style={styles.actionList}>
            <Pressable
              style={styles.actionItem}
              onPress={() => setProfileModalOpen(true)}
            >
              <View style={styles.actionIcon}>
                <Feather name="settings" size={16} color={colors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Mes Informations</Text>
                <Text style={styles.actionHelper}>
                  Photo, pseudo et préférences
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
            <Pressable
              style={styles.actionItem}
              onPress={() => openHouseholdModal("create")}
            >
              <View style={styles.actionIcon}>
                <Feather name="home" size={16} color={colors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Créer un foyer</Text>
                <Text style={styles.actionHelper}>
                  Pour démarrer un espace partagé
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
            <Pressable
              style={styles.actionItem}
              onPress={() => openHouseholdModal("join")}
            >
              <View style={styles.actionIcon}>
                <Feather name="link-2" size={16} color={colors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Rejoindre un foyer</Text>
                <Text style={styles.actionHelper}>
                  Avec le pseudo de l'administrateur
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
            <Pressable
              style={styles.actionItem}
              onPress={() => openHouseholdModal("manage")}
            >
              <View style={styles.actionIcon}>
                <Feather name="users" size={16} color={colors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>Gérer mes membres</Text>
                <Text style={styles.actionHelper}>
                  Inviter, consulter ou retirer quelqu'un
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Feather name="log-out" size={16} color="#fff" />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>

      {fabMenuOpen ? (
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setFabMenuOpen(false)}
        />
      ) : null}

      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setSettingsOpen(false)}
        >
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setSettingsOpen(false);
                setProfileModalOpen(true);
              }}
            >
              <Text style={styles.menuItemText}>Informations du profil</Text>
            </Pressable>
            <View style={styles.menuFooter}>
              <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Se déconnecter</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={profileModalOpen}
        animationType="slide"
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalHeading}>Informations du profil</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{session?.user.email}</Text>
            <Text style={[styles.label, { marginTop: 16 }]}>Pseudo unique</Text>
            {loadingProfile ? (
              <ActivityIndicator color={colors.accentSecondary} />
            ) : (
              <>
                <TextInput
                  placeholder="ex: chef_lucie"
                  placeholderTextColor={colors.muted}
                  value={pseudo}
                  onChangeText={setPseudo}
                  style={styles.input}
                  autoCapitalize="none"
                />
                <Text style={styles.helper}>
                  Ce pseudo sert à rejoindre un foyer commun.
                </Text>
                {pseudoError ? (
                  <Text style={styles.errorText}>{pseudoError}</Text>
                ) : null}
                {pseudoSuccess ? (
                  <Text style={styles.successText}>{pseudoSuccess}</Text>
                ) : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    savingPseudo && styles.buttonDisabled,
                  ]}
                  onPress={handleSavePseudo}
                  disabled={savingPseudo}
                >
                  <Text style={styles.primaryButtonText}>
                    {savingPseudo ? "Enregistrement…" : "Sauvegarder"}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
          <Pressable
            style={styles.modalClose}
            onPress={() => setProfileModalOpen(false)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={householdActionsOpen}
        animationType="slide"
        onRequestClose={() => setHouseholdActionsOpen(false)}
      >
        <SafeAreaView style={styles.modalScreen}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalHeading}>
              Ajouter ou rejoindre un foyer
            </Text>
            {householdModalMode === "create" && (
              <View style={styles.modalBlock}>
                <Text style={styles.subheading}>Créer un foyer</Text>
                <TextInput
                  placeholder="Nom du foyer (ex: Famille Durand)"
                  placeholderTextColor={colors.muted}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  style={styles.input}
                />
                {householdError ? (
                  <Text style={styles.errorText}>{householdError}</Text>
                ) : null}
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
                  Demande à l'admin de te partager son pseudo, puis saisis-le
                  ici.
                </Text>
                <TextInput
                  placeholder="Pseudo de l'administrateur"
                  placeholderTextColor={colors.muted}
                  value={joinPseudo}
                  onChangeText={setJoinPseudo}
                  style={styles.input}
                  autoCapitalize="none"
                />
                {joinError ? (
                  <Text style={styles.errorText}>{joinError}</Text>
                ) : null}
                {joinSuccess ? (
                  <Text style={styles.successText}>{joinSuccess}</Text>
                ) : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    joining && styles.buttonDisabled,
                  ]}
                  onPress={handleJoinHousehold}
                  disabled={joining}
                >
                  <Text style={styles.primaryButtonText}>
                    {joining ? "Connexion…" : "Rejoindre"}
                  </Text>
                </Pressable>
              </View>
            )}
            {householdModalMode === "manage" && (
              <>
                {household ? (
                  <>
                    {renderHouseholdSummary()}
                    {isOwner ? (
                      <View style={styles.modalBlock}>
                        <Text style={styles.subheading}>Ajouter un membre</Text>
                        <Text style={styles.helper}>
                          Invite un proche en indiquant son email de connexion.
                        </Text>
                        <TextInput
                          placeholder="Email du membre"
                          placeholderTextColor={colors.muted}
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
                          <Text style={styles.successText}>
                            {inviteSuccess}
                          </Text>
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
                        Demande à l'admin de ton foyer actuel pour ajouter
                        quelqu'un.
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.helper}>
                    Tu n'as pas encore de foyer actif. Utilise le bouton + pour
                    en créer un.
                  </Text>
                )}
              </>
            )}
          </ScrollView>
          <Pressable
            style={styles.modalClose}
            onPress={() => setHouseholdActionsOpen(false)}
          >
            <Text style={styles.modalCloseText}>Fermer</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
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
    gap: 24,
    paddingBottom: 160,
  },
  heroCard: {
    borderRadius: radii.lg,
    padding: spacing.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 0,
    gap: 16,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#000000ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000ff",
  },
  avatarEdit: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#ffffffff",
    borderRadius: 999,
    padding: 6,
  },
  heroText: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  heroEmail: {
    marginTop: 4,
    color: colors.text,
    fontWeight: "500",
  },
  heroSubtitle: {
    color: colors.text,
    fontSize: 14,
    opacity: 0.8,
    marginTop: -4,
  },
  heroUtilities: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },
  statPill: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: colors.muted,
    marginTop: 4,
    fontWeight: "600",
  },
  section: {
    padding: spacing.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.muted,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: colors.surfaceAlt,
    gap: 8,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  quickActionHelper: {
    fontSize: 13,
    color: colors.muted,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 16,
  },
  infoAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  infoActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  infoActionContent: {
    flex: 1,
    gap: 2,
  },
  infoActionLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  infoActionHelper: {
    fontSize: 13,
    color: colors.muted,
  },
  actionList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 14,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
    gap: 4,
  },
  actionLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  actionHelper: {
    fontSize: 13,
    color: colors.muted,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 32,
    right: 24,
    alignItems: "flex-end",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabMenu: {
    marginTop: 12,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 6,
    width: 200,
    gap: 6,
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fabMenuText: {
    color: "#fff",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    gap: 12,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  menuFooter: {
    marginTop: 8,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    padding: spacing.screen,
    gap: 16,
    paddingBottom: 120,
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  modalBlock: {
    gap: 10,
    paddingVertical: 8,
  },
  modalClose: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalCloseText: {
    color: colors.accent,
    fontWeight: "600",
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  successText: {
    color: colors.accentSecondary,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontWeight: "600",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  householdCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.card,
    backgroundColor: colors.surface,
  },
  householdCardEmpty: {
    borderStyle: "dashed",
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
  },
  householdBadges: {
    flexDirection: "row",
    gap: 8,
  },
  householdMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  householdColumn: {
    flex: 1,
  },
  householdLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  householdName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  householdValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  memberCarousel: {
    gap: 12,
    paddingVertical: 6,
  },
  memberBadge: {
    alignItems: "center",
    gap: 6,
  },
  memberBadgeLetter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 44,
  },
  memberBadgeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  manageButton: {
    marginTop: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    alignItems: "center",
  },
  manageButtonText: {
    color: colors.accent,
    fontWeight: "600",
  },
});
