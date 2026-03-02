export const colors = {
  background: "#F9FAFB", // Modern gray-50
  surface: "#FFFFFF",
  surfaceAlt: "#F9FAFB", // gray-50
  text: "#111827", // gray-900
  muted: "#6B7280", // gray-500
  accent: "#F97316", // Modern orange-500
  accentSecondary: "#10B981", // green-500
  accentTertiary: "#A855F7", // purple-500
  danger: "#EF4444", // red-500
  cardBorder: "#E5E7EB", // gray-200
};

// Gradient definitions for modern design
export const gradients = {
  breakfast: ["#FBBF24", "#F97316"] as [string, string], // yellow to orange
  lunch: ["#34D399", "#10B981"] as [string, string], // light green to green
  dinner: ["#6366F1", "#A855F7"] as [string, string], // indigo to purple
  statsOrange: ["#FED7AA", "#FFEDD5"] as [string, string], // orange tints
  statsGreen: ["#A7F3D0", "#D1FAE5"] as [string, string], // green tints
  statsYellow: ["#FDE68A", "#FEF3C7"] as [string, string], // yellow tints
};

export const radii = {
  xl: 28,
  lg: 20,
  md: 14,
};

export const spacing = {
  base: 10,
  screen: 20,
  card: 18,
};

export const shadows = {
  card: {
    shadowColor: "rgba(92, 80, 66, 0.18)",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: "rgba(92, 80, 66, 0.22)",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
};
