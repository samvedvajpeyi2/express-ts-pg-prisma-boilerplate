import { z } from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),
    WHITE_LIST_URLS: z
        .string()
        .transform((value) => value.split(",").map((url) => url.trim()))
        .refine((urls) => urls.every((url) => z.string().url().safeParse(url).success), {
            message: "Each value in WHITE_LIST_URLS must be a valid URL",
        }),
});

export type EnvVars = z.infer<typeof envSchema>;
