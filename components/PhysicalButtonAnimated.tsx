import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { PhysicalVariant, physicalVariants } from "../theme/shadows";

const SHADOW_OFFSET_REST = 4;
const SHADOW_OFFSET_PRESSED = 1;
const PRESS_TRANSLATE_Y = SHADOW_OFFSET_REST - SHADOW_OFFSET_PRESSED;
const BORDER_RADIUS = 16;
const TRANSITION_DURATION_MS = 200;
const PRESS_EASING = Easing.bezier(0.175, 0.885, 0.32, 1.275);

interface Props {
  onPress: () => void;
  disabled?: boolean;
  variant?: PhysicalVariant;
  /** Override the inner button style (padding, borderRadius, etc.) */
  innerStyle?: ViewStyle;
  children: React.ReactNode;
}

export default function PhysicalButtonAnimated({
  onPress,
  disabled = false,
  variant = "primary",
  innerStyle,
  children,
}: Props) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const { bgColor, shadowColor } = physicalVariants[variant];

  useEffect(() => {
    if (disabled) {
      pressAnim.stopAnimation();
      pressAnim.setValue(0);
    }
  }, [disabled, pressAnim]);

  const animateTo = (toValue: 0 | 1) => {
    pressAnim.stopAnimation();
    Animated.timing(pressAnim, {
      toValue,
      duration: TRANSITION_DURATION_MS,
      easing: PRESS_EASING,
      useNativeDriver: true,
    }).start();
  };

  const faceTranslateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PRESS_TRANSLATE_Y],
  });

  return (
    <View style={styles.wrapper}>
      <View
        pointerEvents="none"
        style={[
          styles.shadowBase,
          {
            backgroundColor: disabled ? "transparent" : shadowColor,
            borderRadius: BORDER_RADIUS,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.face,
          {
            transform: [{ translateY: faceTranslateY }],
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={() => !disabled && animateTo(1)}
          onPressOut={() => !disabled && animateTo(0)}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    paddingBottom: SHADOW_OFFSET_REST,
  },
  shadowBase: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: SHADOW_OFFSET_REST,
    transform: [{ translateY: SHADOW_OFFSET_REST }],
  },
  face: {
    flex: 1,
    zIndex: 1,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
