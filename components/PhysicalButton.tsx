import React from "react";
import {
  AccessibilityRole,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { PhysicalVariant, physicalVariants } from "../theme/shadows";

const DEPTH = 5;
const BORDER_RADIUS = 18;

interface Props {
  onPress: () => void;
  disabled?: boolean;
  variant?: PhysicalVariant;
  /** Override the inner button style (padding, borderRadius, etc.) */
  innerStyle?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

/**
 * Cross-platform "physical" button with a hard offset shadow.
 *
 * The shadow is a colored wrapper View — visible on both iOS and Android.
 * On press the button translates down to "sink" into the shadow.
 */
export default function PhysicalButton({
  onPress,
  disabled = false,
  variant = "primary",
  innerStyle,
  accessibilityRole,
  accessibilityLabel,
  children,
}: Props) {
  const variantConfig = physicalVariants[variant];
  const { bgColor, shadowColor } = variantConfig;
  const borderColor = "borderColor" in variantConfig ? variantConfig.borderColor : undefined;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: disabled ? "transparent" : shadowColor,
          borderRadius: BORDER_RADIUS,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: disabled ? "#E4D9C8" : bgColor,
            borderRadius: BORDER_RADIUS,
          },
          borderColor && { borderWidth: 2, borderColor },
          pressed && !disabled && styles.buttonPressed,
          innerStyle,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: DEPTH,
  },
  button: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ translateY: DEPTH }],
  },
});
