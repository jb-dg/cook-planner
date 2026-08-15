import { ActivityIndicator, Image, Text, TextInput, View } from "react-native";

import PhysicalButton from "@/components/PhysicalButton";
import type { useProfileScreenState } from "@/features/profile/hooks/useProfileScreenState";
import { styles } from "@/features/profile/screens/profileScreenStyles";

type ProfileState = ReturnType<typeof useProfileScreenState>;

type Props = {
  state: ProfileState;
};

// The "Mes informations" content — avatar + pseudo editor. Shared by the
// phone's slide-up modal and the iPad split view's inline detail pane.
export default function ProfileInfoContent({ state }: Props) {
  return (
    <>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.value}>{state.session?.user.email}</Text>
      <Text style={[styles.label, { marginTop: 16 }]}>Photo</Text>
      <View style={styles.avatarEditorRow}>
        <View style={styles.avatarEditorPreview}>
          {state.avatarUrl ? (
            <Image source={{ uri: state.avatarUrl }} style={styles.avatarEditorImage} />
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
    </>
  );
}
