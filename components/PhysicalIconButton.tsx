import { Pressable, StyleSheet, View } from "react-native";

import { physicalVariants } from "../theme/shadows";

const SIZE = 44;
const DEPTH = 3;
const BORDER_RADIUS = 14;

interface Props {
  onPress: () => void;
  /** When active, switches to the neutralDark variant */
  active?: boolean;
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
  children,
  accessibilityLabel,
}: Props) {
  const variant = active ? physicalVariants.neutralDark : physicalVariants.neutralLight;

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: variant.shadowColor, borderRadius: BORDER_RADIUS },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: variant.bgColor, borderRadius: BORDER_RADIUS },
          active && styles.buttonActive,
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
    borderColor: "#E4D9C8",
  },
  buttonActive: {
    borderColor: "#2D2D2A",
  },
  buttonPressed: {
    transform: [{ translateY: DEPTH }],
  },
});
