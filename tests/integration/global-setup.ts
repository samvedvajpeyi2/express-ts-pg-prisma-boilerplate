import { execSync } from "child_process";
import { config } from "dotenv";

export async function setup() {
    // Load .env.test manually — globalSetup runs before vitest's test.env is applied
    // override: true — the app container has DATABASE_URL set to the dev DB as a real OS env var.
    // Without override, dotenv silently skips vars that are already set, so everything would
    // hit the dev DB instead of the test DB.
    config({ path: ".env.test", override: true });

    // Apply all pending migrations to the test database
    execSync("npx prisma migrate deploy", { stdio: "inherit" });

    // Seed roles — required by FK constraint on User.roleId.
    // Upsert is idempotent so this is safe to run every time.
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient, RoleName } = await import("../../generated/prisma/client.js");
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });

    await prisma.role.upsert({
        where: { name: RoleName.USER },
        create: { name: RoleName.USER },
        update: {},
    });
    await prisma.role.upsert({
        where: { name: RoleName.ADMIN },
        create: { name: RoleName.ADMIN },
        update: {},
    });

    await prisma.$disconnect();
}
