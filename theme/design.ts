export const colors = {
  background: "#FDF8F1", // Hearth Cream
  surface: "#FFFFFF",
  surfaceAlt: "#F5EFE4", // warm tinted alt surface
  surfaceWarm: "#F7EFE2", // cream card fill — meal-slot cards on the planner
  text: "#2D2D2A", // Hearth Warm Black
  muted: "#6B705C", // Hearth Sage
  accent: "#BC6C25", // Hearth Accent
  accentSecondary: "#6B705C", // Hearth Sage
  accentTertiary: "#A5A58D", // Hearth Clay
  danger: "#C75252",
  cardBorder: "#E4D9C8", // warm border
};

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
