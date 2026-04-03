import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { breakpoints } from "@/theme/design";

export default function WebFooter() {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= breakpoints.webNavWide;

  return (
    <View style={styles.webFooter}>
      <View style={[styles.webFooterInner, isWideWeb && styles.webFooterInnerWide]}>
        <View style={styles.webFooterBrand}>
          <View style={styles.webFooterBrandIcon} />
          <Text style={styles.webFooterBrandText}>Weatly</Text>
        </View>
        <View style={styles.webFooterLinks}>
          <Text style={styles.webFooterLinkText}>Privacy</Text>
          <Text style={styles.webFooterLinkText}>Help Center</Text>
          <Text style={styles.webFooterLinkText}>Settings</Text>
        </View>
        <Text style={styles.webFooterCopy}>© 2026 Weatly.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webFooter: {
    width: "100%",
    marginTop: 32,
    backgroundColor: "#2D2D2A",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  webFooterInner: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    flexDirection: "column",
    gap: 14,
    alignItems: "flex-start",
  },
  webFooterInnerWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webFooterBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webFooterBrandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#BC6C25",
  },
  webFooterBrandText: {
    color: "#FDF8F1",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  webFooterLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  webFooterLinkText: {
    color: "rgba(253,248,241,0.52)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  webFooterCopy: {
    color: "rgba(253,248,241,0.3)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
