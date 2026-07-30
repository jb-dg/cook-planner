import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { PhysicalVariant, physicalVariants } from "../theme/shadows";

const DEPTH = 4;
const BORDER_RADIUS = 18;

interface Props {
  onPress: () => void;
  disabled?: boolean;
  variant?: PhysicalVariant;
  /** Override the inner button style (padding, borderRadius, etc.) */
  innerStyle?: ViewStyle;
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
  children,
}: Props) {
  const { bgColor, shadowColor } = physicalVariants[variant];

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
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: disabled ? "#E4D9C8" : bgColor,
            borderRadius: BORDER_RADIUS,
          },
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
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ translateY: DEPTH }],
  },
});
