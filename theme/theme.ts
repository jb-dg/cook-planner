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
    primary: "#BC6C25", // Hearth Accent
    primarySoft: "#F2E0CB", // warm tint of accent
    primaryOn: "#FFFFFF",
    accent: "#6B705C", // Hearth Sage
    accentOn: "#FDF8F1", // Hearth Cream
    bg: "#FDF8F1", // Hearth Cream
    surface: "#FFFFFF",
    surfaceAlt: "#F5EFE4", // warm alt surface
    textPrimary: "#2D2D2A", // Hearth Warm Black
    textSecondary: "#4A4540",
    textMuted: "#6B705C", // Hearth Sage
    borderSubtle: "#E4D9C8", // warm subtle border
    borderStrong: "#CFC1A8", // warm strong border
    error: "#C75252",
    success: "#5F6F41", // sage-700
    overlay: "rgba(45, 45, 42, 0.55)",
  },
  dark: {
    primary: "#DDA15E", // Hearth Soft (lighter for dark)
    primarySoft: "#3D2A14",
    primaryOn: "#0F0A06",
    accent: "#A5A58D", // Hearth Clay (lighter in dark)
    accentOn: "#0F0A06",
    bg: "#1A1510", // very dark warm brown
    surface: "#241C15",
    surfaceAlt: "#2E2420",
    textPrimary: "#F5EFE4", // warm white
    textSecondary: "#D4C9B8",
    textMuted: "#A5A58D", // Hearth Clay
    borderSubtle: "#3D3228",
    borderStrong: "#5A4A38",
    error: "#D27A6B",
    success: "#9FB476",
    overlay: "rgba(12, 8, 4, 0.65)",
  },
};

const typography: Theme["typography"] = {
  family: {
    regular: "Inter",
    medium: "Inter",
    semibold: "Inter",
    bold: "Inter",
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
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
};

const radius: Theme["radius"] = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

const createShadow = (mode: ColorMode): Theme["shadow"] => {
  const shadowColor =
    mode === "light" ? "rgba(92, 80, 66, 0.18)" : "rgba(12, 9, 8, 0.32)";

  return {
    sm: {
      elevation: 2,
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    md: {
      elevation: 5,
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
    },
    lg: {
      elevation: 8,
      shadowColor,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 22,
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
