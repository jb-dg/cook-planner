import { Platform } from "react-native";

// ─── Physical button variants ────────────────────────────────────────────────
// Each variant pairs a button background color with its hard shadow color.
// Used by PhysicalButton and PhysicalIconButton.

export const physicalVariants = {
  primary:      { bgColor: "#BC6C25", shadowColor: "#8B4513" },
  danger:       { bgColor: "#C75252", shadowColor: "#8B2020" },
  neutralLight: { bgColor: "#F5EFE4", shadowColor: "#8B4513" },
  neutralDark:  { bgColor: "#2D2D2A", shadowColor: "#000000" },
} as const;

export type PhysicalVariant = keyof typeof physicalVariants;

// ─── Soft decorative shadow utility ─────────────────────────────────────────
// iOS → colored shadow.  Android → elevation only (material shadow).
// Use this for cards and surfaces — NOT for interactive buttons.

export const softShadow = (shadowColor: string, elevation = 4) =>
  Platform.OS === "android"
    ? { elevation }
    : {
        shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 20,
        elevation,
      };
