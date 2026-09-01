import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import PhysicalIconButton from "@/components/PhysicalIconButton";
import { colors, spacing } from "@/theme/design";

type Props = {
  visible: boolean;
  bookName: string;
  bookError: string | null;
  onBookNameChange: (value: string) => void;
  onCreateBook: () => void;
  onClose: () => void;
};

// Shared by the iPad split view and the phone books list — both used to
// have their own way to create a book (a modal on iPad, an always-visible
// inline input + button on phone). One shared modal keeps the two in sync
// and gets the always-on input off the phone screen for something done
// rarely.
export default function CreateBookModal({
  visible,
  bookName,
  bookError,
  onBookNameChange,
  onCreateBook,
  onClose,
}: Props) {
  // Success is detected indirectly: onCreateBook clears bookName and
  // bookError together on success, only sets bookError on failure — so
  // once bookError settles after a submit we know which happened.
  const justSubmittedRef = useRef(false);
  useEffect(() => {
    if (!justSubmittedRef.current) return;
    justSubmittedRef.current = false;
    if (!bookError) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookError, bookName]);

  const submit = () => {
    justSubmittedRef.current = true;
    onCreateBook();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.positioner} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouveau livre</Text>
            <PhysicalIconButton
              variant="secondary"
              onPress={onClose}
              accessibilityLabel="Fermer"
            >
              <Feather name="x" size={16} color={colors.muted} />
            </PhysicalIconButton>
          </View>
          <TextInput
            value={bookName}
            onChangeText={onBookNameChange}
            placeholder="Nom du livre"
            placeholderTextColor="#A5A58D"
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {bookError ? <Text style={styles.errorText}>{bookError}</Text> : null}
          <PhysicalButtonAnimated
            variant="primary"
            onPress={submit}
            innerStyle={styles.confirmInner}
          >
            <Feather name="check" size={14} color="#FFFFFF" />
            <Text style={styles.confirmText}>Créer le livre</Text>
          </PhysicalButtonAnimated>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  positioner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.screen,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: spacing.card,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },
  input: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#FCFAF7",
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  confirmInner: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
