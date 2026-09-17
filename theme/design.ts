export const colors = {
  background: "#FDF8F1", // Hearth Cream
  surface: "#FFFFFF",
  surfaceAlt: "#F5EFE4", // warm tinted alt surface
  surfaceWarm: "#F7EFE2", // cream card fill — meal-slot cards on the planner
  text: "#2D2D2A", // Hearth Warm Black
  muted: "#6B705C", // Hearth Sage
  accent: "#BC6C25", // Hearth Accent
  accentSoft: "#DDA15E", // Hearth Soft
  accentSecondary: "#6B705C", // Hearth Sage
  accentTertiary: "#A5A58D", // Hearth Clay
  danger: "#C75252",
  cardBorder: "#E4D9C8", // warm border
  shadow: "#000", // generic elevation-shadow black — matches shadows.subtle below
};

// Supplementary tints already in use around the app — not part of the core
// Hearth palette above, but real, repeated (or once-off) values worth naming
// instead of leaving as raw hex.
export const tints = {
  surfaceCream: "#FCFAF7", // lightest input/card fill — recipe book screens
  cardBorderDashed: "#E6D3B8", // dashed border on an empty meal slot
  dividerOnWarm: "#EEE3D2", // subtle divider drawn over a warm/cream surface
  textFaint: "#B3A88F", // fainter than colors.muted — low-emphasis prompts
  badgeCream: "#F4E9D9", // soft cream badge fill (e.g. date badge)
};

// Typography scale — single source for font sizes/weights (was duplicated in theme/theme.ts).
export const typography = {
  family: {
    regular: "Inter",
    medium: "Inter",
    semibold: "Inter",
    bold: "Inter",
    // Reserved for a few high-emotion, low-frequency touches (an editorial
    // accroche, a friendly empty state) — not a general-purpose UI face.
    handwritten: "CoveredByYourGrace_400Regular",
  },
  size: {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    bodySmall: 14,
    label: 13,
    caption: 12,
  },
  lineHeight: {
    h1: 36,
    h2: 28,
    h3: 24,
    body: 22,
    bodySmall: 20,
    label: 18,
    caption: 16,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

// Gradient definitions — Hearth warm palette
export const gradients = {
  breakfast: ["#DDA15E", "#BC6C25"] as [string, string], // Soft to Accent
  lunch: ["#A5A58D", "#6B705C"] as [string, string], // Clay to Sage
  dinner: ["#BC6C25", "#8B4810"] as [string, string], // Accent to deep warm
  statsOrange: ["#F2E0CB", "#DDA15E"] as [string, string], // warm tints
  statsGreen: ["#D4DBC8", "#A5A58D"] as [string, string], // sage tints
  statsYellow: ["#F5EFE4", "#E4D9C8"] as [string, string], // cream tints
};

export const radii = {
  xl: 9999,
  lg: 20,
  md: 14,
};

// Coherent radius scale — pill only for filters/status/small buttons,
// medium/large for cards, more moderate radii for square buttons.
export const radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
};

export const spacing = {
  base: 10,
  screen: 20,
  card: 18,
  // Finer scale (was duplicated in theme/theme.ts) for tighter, componentized layouts.
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const shadows = {
  // Lightweight elevation for small inline cards/rows (profile rows, chips-as-buttons).
  // Kept distinct from `card`/`soft` below, which are for larger surfaces.
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "rgba(45, 45, 42, 0.15)",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: "rgba(45, 45, 42, 0.18)",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  // Light shadow for floating elements — keep hard/heavy shadows off cards.
  floating: {
    shadowColor: "rgba(45, 45, 42, 0.16)",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};
