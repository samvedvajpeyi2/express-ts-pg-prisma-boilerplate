import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "./env-config.js";

const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
});

// Define a typed global holder for Prisma instance in Node process memory.
// Adding for dev stability, so we can reuse the same instance across hot reloads instead of creating new ones.
const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

// Reuse existing Prisma instance if already created; otherwise create a new one.
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        // Inject adapter so Prisma uses node-postgres driver mode.
        adapter,
    });

// In non-production, cache the instance globally for hot-reload safety.
if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
