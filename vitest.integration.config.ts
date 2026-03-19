import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load .env.test at config-load time so DATABASE_URL is available to pass into test.env below.
// override: true — the app container has DATABASE_URL set to the dev DB as a real OS env var;
// without override, dotenv skips it and all worker processes would connect to the dev DB.
config({ path: ".env.test", override: true });

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["tests/integration/**/*.test.ts"],
        globalSetup: ["tests/integration/global-setup.ts"],
        setupFiles: ["tests/integration/per-test-setup.ts"],
        watch: false,
        // Sequential execution — concurrent test files mutating the same DB causes conflicts
        pool: "forks",
        fileParallelism: false,
        env: {
            NODE_ENV: "test",
            // Explicitly forward DATABASE_URL so all worker processes connect to the test DB,
            // not the dev DB that is set in the Docker container's OS environment.
            DATABASE_URL: process.env.DATABASE_URL!,
        },
    },
});
