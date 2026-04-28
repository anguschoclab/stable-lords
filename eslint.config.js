import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "src/routeTree.gen.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    /* ARCHITECTURAL BOUNDARY: ENGINE */
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Do not use Math.random() in engine code. Use rngFromSeed/rngForWorld (src/engine/rng.ts).",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../components/*",
                "../pages/*",
                "../hooks/*",
                "../contexts/*",
                "../presenters/*",
                "@/components/*",
                "@/pages/*",
                "@/hooks/*",
                "@/contexts/*",
                "@/presenters/*",
              ],
              message: "Engine code must not import from UI or React layers to maintain architectural boundaries.",
            },
          ],
        },
      ],
    },
  },
  {
    /* ARCHITECTURAL BOUNDARY: UI/PAGES */
    files: ["src/components/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/engine/types/world", "**/engine/tick/*", "**/engine/storage/*"],
              message: "UI components should only consume processed UIDigest. Direct access to raw engine state or systems is forbidden.",
            },
            {
              group: ["**/engine/!(types/common|worker/*)"],
              message: "Importing logic from src/engine/ is forbidden. Use src/presenters/ or src/engine/types/common.",
            },
          ],
        },
      ],
    },
  },
  {
    /* BY-DESIGN: Logger utility intentionally uses console */
    files: ["src/utils/logger.ts"],
    rules: { "no-console": "off" },
  },
  {
    /* TEST FILES: Allow non-null assertions for convenience in tests */
    files: ["src/test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  {
    /* SCRATCH/SCRIPTS: Utility/debug files - allow non-null assertions */
    files: ["scratch/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}", "*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  }
);
