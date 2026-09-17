import { Feather } from "@expo/vector-icons";
import { View } from "react-native";
import { Text } from "@/components/Text";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import { colors } from "@/theme/design";

import { styles } from "@/features/profile/screens/profileScreenStyles";

type Props = {
  onSignOut: () => void;
  erasingData: boolean;
  deletingAccount: boolean;
  onEraseData: () => void;
  onDeleteAccount: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenSupport: () => void;
};

// "Paramètres" content: session, puis la section "Données et sécurité"
// (politique de confidentialité + actions destructives sur le compte),
// rendue dans le sous-menu "Paramètres" (slide modal sur téléphone,
// panneau de détail sur iPad). Les boutons gardent le style CTA de
// l'app (PhysicalButtonAnimated), recoloré selon la gravité : neutre
// pour Se déconnecter et Politique de confidentialité, contour rouge
// pour "Effacer toutes mes données" (réversible en repartant de zéro),
// et rouge plein pour "Supprimer mon compte" (irréversible).
export default function SettingsSection({
  onSignOut,
  erasingData,
  deletingAccount,
  onEraseData,
  onDeleteAccount,
  onOpenPrivacyPolicy,
  onOpenSupport,
}: Props) {
  return (
    <View style={styles.settingsCard}>
      <PhysicalButtonAnimated variant="secondary" onPress={onSignOut}>
        <View style={styles.ctaButtonInner}>
          <Feather name="log-out" size={16} color={colors.muted} />
          <Text style={[styles.ctaButtonText, { color: colors.muted }]}>
            Se déconnecter
          </Text>
        </View>
      </PhysicalButtonAnimated>

      <PhysicalButtonAnimated variant="secondary" onPress={onOpenSupport}>
        <View style={styles.ctaButtonInner}>
          <Feather name="help-circle" size={16} color={colors.muted} />
          <Text style={[styles.ctaButtonText, { color: colors.muted }]}>
            Aide & assistance
          </Text>
        </View>
      </PhysicalButtonAnimated>

      <View style={styles.settingsDivider} />

      <View style={styles.dangerZoneLabelRow}>
        <Feather name="shield" size={13} color={colors.muted} />
        <Text style={[styles.dangerZoneLabel, { color: colors.muted }]}>
          Données et sécurité
        </Text>
      </View>

      <PhysicalButtonAnimated variant="secondary" onPress={onOpenPrivacyPolicy}>
        <View style={styles.ctaButtonInner}>
          <Feather name="file-text" size={16} color={colors.muted} />
          <Text style={[styles.ctaButtonText, { color: colors.muted }]}>
            Politique de confidentialité
          </Text>
        </View>
      </PhysicalButtonAnimated>

      <PhysicalButtonAnimated
        variant="dangerOutline"
        onPress={onEraseData}
        disabled={erasingData}
      >
        <View style={styles.ctaButtonInner}>
          <Feather name="trash-2" size={16} color={colors.danger} />
          <Text style={[styles.ctaButtonText, { color: colors.danger }]}>
            {erasingData ? "Effacement…" : "Effacer toutes mes données"}
          </Text>
        </View>
      </PhysicalButtonAnimated>

      <PhysicalButtonAnimated
        variant="danger"
        onPress={onDeleteAccount}
        disabled={deletingAccount}
      >
        <View style={styles.ctaButtonInner}>
          <Feather name="user-x" size={16} color="#fff" />
          <Text style={[styles.ctaButtonText, { color: "#fff" }]}>
            {deletingAccount ? "Suppression…" : "Supprimer mon compte"}
          </Text>
        </View>
      </PhysicalButtonAnimated>
    </View>
  );
}
