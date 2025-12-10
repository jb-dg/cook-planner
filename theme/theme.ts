export type ColorMode = "light" | "dark";

export interface Theme {
  mode: ColorMode;
  colors: {
    primary: string;
    primarySoft: string;
    primaryOn: string;
    accent: string;
    accentOn: string;
    bg: string;
    surface: string;
    surfaceAlt: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderSubtle: string;
    borderStrong: string;
    error: string;
    success: string;
    overlay: string;
  };
  typography: {
    family: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    size: {
      h1: number;
      h2: number;
      h3: number;
      body: number;
      bodySmall: number;
      label: number;
      caption: number;
    };
    lineHeight: {
      h1: number;
      h2: number;
      h3: number;
      body: number;
      bodySmall: number;
      label: number;
      caption: number;
    };
    weight: {
      regular: "400";
      medium: "500";
      semibold: "600";
      bold: "700";
    };
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  shadow: {
    sm: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
    md: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
    lg: {
      elevation: number;
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    };
  };
  components: {
    button: {
      height: number;
      borderRadius: number;
      paddingHorizontal: number;
      primary: {
        backgroundColor: string;
        textColor: string;
      };
      secondary: {
        backgroundColor: string;
        textColor: string;
        borderColor: string;
      };
      ghost: {
        backgroundColor: string;
        textColor: string;
      };
    };
    card: {
      borderRadius: number;
      padding: number;
      backgroundColor: string;
      headerSpacingBottom: number;
    };
    chip: {
      height: number;
      paddingHorizontal: number;
      borderRadius: number;
      textSize: number;
    };
    textInput: {
      height: number;
      borderRadius: number;
      paddingHorizontal: number;
      borderColor: string;
      backgroundColor: string;
      placeholderColor: string;
    };
    tabBar: {
      height: number;
      backgroundColor: string;
      activeTintColor: string;
      inactiveTintColor: string;
      borderTopColor: string;
    };
  };
}

type Palette = Theme["colors"];

const palette: Record<ColorMode, Palette> = {
  light: {
    primary: "#2ECC71",
    primarySoft: "#E9F9F1",
    primaryOn: "#FFFFFF",
    accent: "#FFB15C",
    accentOn: "#111827",
    bg: "#F7F5F2",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    borderSubtle: "#E5E7EB",
    borderStrong: "#D1D5DB",
    error: "#EF4444",
    success: "#16A34A",
    overlay: "rgba(15, 23, 42, 0.55)",
  },
  dark: {
    primary: "#3AD479",
    primarySoft: "#163726",
    primaryOn: "#0B1A10",
    accent: "#FFC176",
    accentOn: "#0F172A",
    bg: "#050816",
    surface: "#111827",
    surfaceAlt: "#1F2933",
    textPrimary: "#F9FAFB",
    textSecondary: "#D1D5DB",
    textMuted: "#9CA3AF",
    borderSubtle: "#1B2430",
    borderStrong: "#2C3542",
    error: "#F87171",
    success: "#22C55E",
    overlay: "rgba(5, 8, 22, 0.65)",
  },
};

const typography: Theme["typography"] = {
  family: {
    regular: "System", // Uses SF Pro Text on iOS and Roboto on Android
    medium: "System",
    semibold: "System",
    bold: "System",
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
};

const spacing: Theme["spacing"] = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const radius: Theme["radius"] = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

const createShadow = (mode: ColorMode): Theme["shadow"] => {
  const shadowColor =
    mode === "light" ? "rgba(15, 23, 42, 0.18)" : "rgba(0, 0, 0, 0.38)";

  return {
    sm: {
      elevation: 1,
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
    },
    md: {
      elevation: 4,
      shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
    },
    lg: {
      elevation: 10,
      shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
  };
};

const createComponents = (mode: ColorMode, colors: Theme["colors"]): Theme["components"] => ({
  button: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    primary: {
      backgroundColor: colors.primary,
      textColor: colors.primaryOn,
    },
    secondary: {
      backgroundColor: mode === "light" ? colors.surface : colors.surfaceAlt,
      textColor: colors.primary,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: "transparent",
      textColor: colors.textPrimary,
    },
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    headerSpacingBottom: spacing.sm,
  },
  chip: {
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    textSize: typography.size.label,
    // Default chip background should use colors.surfaceAlt; for active state, swap to colors.primarySoft.
  },
  textInput: {
    height: 46,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderColor: colors.borderSubtle,
    backgroundColor: mode === "light" ? colors.surface : colors.surfaceAlt,
    placeholderColor: colors.textMuted,
  },
  tabBar: {
    height: 58,
    backgroundColor: colors.surface,
    activeTintColor: colors.primary,
    inactiveTintColor: colors.textMuted,
    borderTopColor: colors.borderSubtle,
  },
});

const createTheme = (mode: ColorMode): Theme => {
  const colors = palette[mode];
  return {
    mode,
    colors,
    typography,
    spacing,
    radius,
    shadow: createShadow(mode),
    components: createComponents(mode, colors),
  };
};

export const theme = {
  light: createTheme("light"),
  dark: createTheme("dark"),
} as const satisfies Record<ColorMode, Theme>;

export type ThemeMap = typeof theme;

// Usage example (not exported):
const exampleTheme: Theme = theme.light;
const exampleStyles = {
  primaryButton: {
    backgroundColor: exampleTheme.components.button.primary.backgroundColor,
    color: exampleTheme.components.button.primary.textColor,
    paddingHorizontal: exampleTheme.components.button.paddingHorizontal,
    borderRadius: exampleTheme.components.button.borderRadius,
  },
  heading: {
    fontFamily: exampleTheme.typography.family.regular,
    fontSize: exampleTheme.typography.size.h1,
    lineHeight: exampleTheme.typography.lineHeight.h1,
    fontWeight: exampleTheme.typography.weight.semibold,
    color: exampleTheme.colors.textPrimary,
  },
  tabBar: {
    height: exampleTheme.components.tabBar.height,
    backgroundColor: exampleTheme.components.tabBar.backgroundColor,
    borderTopColor: exampleTheme.components.tabBar.borderTopColor,
  },
};
