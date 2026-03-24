import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/design";

type ProfileSlideModalProps = {
  visible: boolean;
  onClose: () => void;
  keyboardVerticalOffset: number;
  closeIconStyle: StyleProp<ViewStyle>;
  contentContainerStyle: StyleProp<ViewStyle>;
  title?: string;
  automaticallyAdjustKeyboardInsets?: boolean;
  children: ReactNode;
};

export default function ProfileSlideModal({
  visible,
  onClose,
  keyboardVerticalOffset,
  closeIconStyle,
  contentContainerStyle,
  title,
  automaticallyAdjustKeyboardInsets,
  children,
}: ProfileSlideModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalScreen}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <Pressable style={closeIconStyle} onPress={onClose}>
            <Feather name="x" size={18} color="#2D2D2A" />
          </Pressable>
          <ScrollView
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          >
            {title ? <Text style={styles.modalHeading}>{title}</Text> : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalKeyboardAvoiding: {
    flex: 1,
  },
  modalHeading: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.3,
  },
});
