import bcrypt from "bcryptjs";

import { RoleName } from "../../generated/prisma/client.js";
import { prisma } from "../../src/config/prisma.js";

// Delete in FK-safe order: RefreshTokens → Users (Roles are kept)
export async function cleanDatabase() {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
}

// Creates a user with ADMIN role directly in the DB (bypasses API)
export async function createAdminUser(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);
    return prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: { connect: { name: RoleName.ADMIN } },
        },
    });
}
