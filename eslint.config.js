import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import nPlugin from "eslint-plugin-n";
import promisePlugin from "eslint-plugin-promise";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import securityPlugin from "eslint-plugin-security";
import globals from "globals";

export default tseslint.config(
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "generated/**",
            "coverage/**",
            "prisma/migrations/**",
            "prisma/seed.ts",
            "prisma.config.ts",
        ],
    },
    js.configs.recommended,

    // Project-specific TypeScript rules/plugins.
    {
        // Apply this block to all TypeScript files
        files: ["**/*.ts"],

        // Scoped here so type-aware rules only run on .ts files (not .js configs)
        extends: tseslint.configs.recommendedTypeChecked,

        // Language options (parser settings and globals)
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.eslint.json",
            },
            globals: {
                ...globals.node,
            },
        },

        // Register extra ESLint plugins used by custom rules below
        plugins: {
            import: importPlugin,
            "simple-import-sort": simpleImportSort,
            security: securityPlugin,
            prettier: prettierPlugin,
            n: nPlugin,
            promise: promisePlugin,
        },

        // Custom rules for this project
        rules: {
            // Fail lint if file formatting differs from Prettier
            "prettier/prettier": "error",

            // Allow any temporarily, but show warning so it can be reduced over time
            "@typescript-eslint/no-explicit-any": "warn",
            // Allow `_`-prefixed vars/args to mark intentionally unused values
            "@typescript-eslint/no-unused-vars": [
                "error",
                { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
            ],
            // Catch promises that are created but never awaited/handled
            "@typescript-eslint/no-floating-promises": "error",
            // Prefer `import type` for type-only imports for better readability and potential performance benefits
            "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

            // Promise best-practice rules
            "promise/always-return": "error",
            "promise/no-return-wrap": "error",
            "promise/param-names": "error",

            // Node.js safety rules (tuned for TypeScript + path aliases)
            "n/no-deprecated-api": "error",
            "n/no-missing-import": "off",
            "n/no-process-exit": "off",
            // Force env access through env-config module only
            "no-restricted-properties": [
                "error",
                {
                    object: "process",
                    property: "env",
                    message:
                        "Use env from src/config/env-config.ts instead of process.env directly.",
                },
            ],

            // Force all imports to be at top of file
            "import/first": "error",
            // Require a blank line after import section
            "import/newline-after-import": "error",
            // Enforce sorted import/export statements
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            // This rule is often noisy for normal object access patterns; so keeping it off for now
            "security/detect-object-injection": "off",
        },
    },

    // Env loader is the only place allowed to read process.env directly
    {
        files: ["src/config/env-config.ts"],
        rules: {
            "no-restricted-properties": "off",
        },
    },

    // Disable formatting-related ESLint rules that clash with Prettier
    prettierConfig,
);
