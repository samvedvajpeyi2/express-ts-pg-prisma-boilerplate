import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["**/__tests__/**/*.test.*"],
        passWithNoTests: false,
        setupFiles: ["tests/setup.ts"],
        watch: false,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            exclude: [
                "**/generated/**",
                "**/dist/**",
                "**/node_modules/**",
                "**/__tests__/**",
                "**/tests/**",
            ],
        },
    },
});
