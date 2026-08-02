import { Pressable, StyleSheet, View } from "react-native";

import { PhysicalVariant, physicalVariants } from "../theme/shadows";

const SIZE = 44;
const DEPTH = 3;
const BORDER_RADIUS = 14;

interface Props {
  onPress: () => void;
  /** When active, switches to the neutralDark variant */
  active?: boolean;
  /** Explicit variant override (e.g. "secondary") — takes precedence over active/inactive */
  variant?: PhysicalVariant;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * Compact 44×44 physical icon button.
 * Inactive → neutralLight (#F5EFE4 / #8B4513 shadow)
 * Active   → neutralDark  (#2D2D2A / #000 shadow)
 *
 * Same cross-platform wrapper approach as PhysicalButton.
 */
export default function PhysicalIconButton({
  onPress,
  active = false,
  variant,
  children,
  accessibilityLabel,
}: Props) {
  const variantConfig = variant
    ? physicalVariants[variant]
    : active
      ? physicalVariants.neutralDark
      : physicalVariants.neutralLight;
  const borderColor =
    "borderColor" in variantConfig
      ? variantConfig.borderColor
      : active
        ? "#2D2D2A"
        : "#E4D9C8";

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: variantConfig.shadowColor, borderRadius: BORDER_RADIUS },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: variantConfig.bgColor,
            borderRadius: BORDER_RADIUS,
            borderColor,
          },
          pressed && styles.buttonPressed,
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
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonPressed: {
    transform: [{ translateY: DEPTH }],
  },
});
