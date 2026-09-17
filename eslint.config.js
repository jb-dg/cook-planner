// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Design-system guard: colors belong in theme/design.ts (or theme/shadows.ts
    // for the physical-button variants) — a raw hex literal anywhere else is
    // either a duplicate of an existing token or a gap in the palette.
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3}){1,2}$/]",
          message:
            'Avoid hardcoded hex colors — import a token from theme/design.ts (or theme/shadows.ts for physical-button variants) instead.',
        },
      ],
    },
  },
]);
