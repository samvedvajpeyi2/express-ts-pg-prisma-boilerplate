import fs from "fs";
import dotenv from "dotenv";
import { envSchema, EnvVars } from "./env-schema.ts";

// Determine which .env file to load based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
// eslint-disable-next-line node/no-process-env
const envFile = nodeEnv === "production" ? ".env" : ".env.dev";

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    // eslint-disable-next-line node/no-process-env
    console.log(
        `✅ Loaded environment: ${envFile}\nNODE_ENV: ${process.env.NODE_ENV}`,
    );
} else {
    console.warn(
        `⚠️ Warning: Environment file "${envFile}" not found. Using defaults.`,
    );
}

// Validate env with schema
// eslint-disable-next-line node/no-process-env
const parsedEnv = envSchema.safeParse(process.env);
// eslint-disable-next-line node/no-process-env
const NODE_ENV = process.env.NODE_ENV || "development";

if (!parsedEnv.success) {
    const formattedErrors = parsedEnv.error.format();
    const missingKeys = Object.keys(formattedErrors).filter(
        (key) => key !== "_errors",
    );
    console.error(
        `❌ Missing environment variables in "${NODE_ENV}" .env file:\n${missingKeys.join(", ")}`,
    );
    process.exit(1);
}

export const env: EnvVars = parsedEnv.data;

// Detect extra/unused env vars (ignore common system vars)
const definedEnvKeys = Object.keys(process.env);
const allowedKeys = Object.keys(envSchema.shape);
const systemVars = new Set([
    "PATH",
    "HOME",
    "SHELL",
    "PWD",
    "OLDPWD",
    "TMPDIR",
    "TERM",
    "USER",
    "LOGNAME",
    "NODE",
    "NPM_CONFIG_LOGLEVEL",
    "NODE_VERSION",
    "HOSTNAME",
    "YARN_VERSION",
    "SHLVL",
    "COLOR",
    "INIT_CWD",
    "EDITOR",
]);

const extraKeys = definedEnvKeys.filter(
    (key) =>
        !allowedKeys.includes(key) &&
        !systemVars.has(key) &&
        !key.startsWith("npm_") &&
        !key.startsWith("MSYSTEM") &&
        !key.startsWith("MINGW") &&
        !key.startsWith("WT_"),
);

if (extraKeys.length > 0) {
    console.warn(
        `⚠️ Warning: Undeclared environment variables detected: ${extraKeys.join(", ")}`,
    );
}
