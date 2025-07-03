import typescriptESLintParser from '@typescript-eslint/parser';
import eslintPluginTypescriptESLint from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    // Global ignores can be added here if needed, for example:
    // ignores: ["dist/", "node_modules/"]
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptESLintParser,
      parserOptions: {
        project: "./tsconfig.json", // Required for type-aware linting rules
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Define any global variables used in your project if necessary
        // Example: myGlobal: "readonly"
      }
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypescriptESLint,
    },
    rules: {
      // Start with recommended rules from @typescript-eslint/eslint-plugin
      // This is a common way to include them in flat config.
      // The plugin object itself often exposes a 'configs' property.
      // We'll use the direct rule definitions from the plugin's 'recommended' config.
      ...eslintPluginTypescriptESLint.configs.recommended.rules,
      // If you need type-aware rules, you might use:
      // ...eslintPluginTypescriptESLint.configs['recommended-type-checked'].rules,
      // or ...eslintPluginTypescriptESLint.configs['strict-type-checked'].rules,
      // Make sure parserOptions.project is set for type-aware rules.

      // Specific rules previously in .eslintrc.json
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "prefer-const": "error",
      "no-var": "error",

      // Any other custom rules or overrides
    },
  },
  // Add Prettier config last to override any formatting rules from other configs
  eslintConfigPrettier,
];
