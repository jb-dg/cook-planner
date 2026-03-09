import { theme, Theme } from "./theme";

/**
 * Returns the active Hearth theme tokens.
 * Extend with ColorScheme context when dark mode is needed.
 */
export const useTheme = (): Theme => theme.light;
