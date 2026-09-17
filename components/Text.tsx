import { Text as RNText, StyleSheet, type TextProps } from "react-native";

// Maps the numeric fontWeight values used across the app's styles to the
// matching Inter static font file. Android ignores fontFamily when it can't
// find an exact weight match for the given fontWeight, so once a family is
// picked here fontWeight is stripped from the final style — the weight is
// already baked into the font file.
const REGULAR_BY_WEIGHT: Record<string, string> = {
  "400": "Inter_400Regular",
  normal: "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  bold: "Inter_700Bold",
  "800": "Inter_800ExtraBold",
  "900": "Inter_900Black",
};

const ITALIC_BY_WEIGHT: Record<string, string> = {
  "400": "Inter_400Regular_Italic",
  normal: "Inter_400Regular_Italic",
  "500": "Inter_500Medium_Italic",
  "600": "Inter_600SemiBold_Italic",
  "700": "Inter_700Bold_Italic",
  bold: "Inter_700Bold_Italic",
  "800": "Inter_800ExtraBold_Italic",
  "900": "Inter_900Black_Italic",
};

function resolveInterFamily(fontWeight: unknown, isItalic: boolean): string {
  const table = isItalic ? ITALIC_BY_WEIGHT : REGULAR_BY_WEIGHT;
  const key = typeof fontWeight === "string" ? fontWeight : "400";
  return table[key] ?? table["400"];
}

export function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style) ?? {};

  // An explicit fontFamily (e.g. the handwritten accent face) is a deliberate
  // choice — leave it alone instead of forcing it back to an Inter variant.
  if (flattened.fontFamily) {
    return <RNText {...props} style={style} />;
  }

  const fontFamily = resolveInterFamily(flattened.fontWeight, flattened.fontStyle === "italic");

  return <RNText {...props} style={[style, { fontFamily, fontWeight: undefined }]} />;
}
