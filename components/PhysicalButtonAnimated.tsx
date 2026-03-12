import React, { useState } from "react";
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
 * On press the wrapper's paddingBottom collapses to 0, making the shadow
 * disappear and giving the impression the button sinks into the surface.
 */
export default function PhysicalButtonAnimated({
  onPress,
  disabled = false,
  variant = "primary",
  innerStyle,
  children,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const { bgColor, shadowColor } = physicalVariants[variant];
  const isPressed = pressed && !disabled;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: disabled ? "transparent" : shadowColor,
          borderRadius: BORDER_RADIUS,
          paddingBottom: isPressed ? 0 : DEPTH,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor: disabled ? "#E4D9C8" : bgColor,
            borderRadius: BORDER_RADIUS,
          },
          innerStyle,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  button: {
    paddingVertical: 18,
    alignItems: "center",
  },
});
