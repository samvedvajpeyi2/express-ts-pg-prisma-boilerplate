import bcrypt from "bcryptjs";
import crypto from "crypto";

import type { RoleName } from "../../../../generated/prisma/client.js";
import { env } from "../../../config/env-config.js";
import { signRefreshToken, signToken, verifyRefreshToken } from "../../../utils/jwt.util.js";
import { parseDurationMs } from "../../../utils/time.util.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

export class AuthService {
    constructor(private readonly repo: AuthRepository) {}

    private async buildRefreshToken(userId: number, role: RoleName): Promise<string> {
        const rawToken = signRefreshToken({ userId, role });
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN));
        await this.repo.createRefreshToken({ userId, tokenHash, expiresAt });
        return rawToken;
    }

    async register(input: RegisterInput) {
        const email = input.email.trim().toLowerCase();

        const existing = await this.repo.findByEmail(email);
        if (existing) {
            return {
                success: false,
                message: "User already exists with this email",
            };
        }

        const hashedPassword = await bcrypt.hash(input.password, 12);

        const user = await this.repo.createUser({
            email,
            password: hashedPassword,
            firstname: input.firstname?.trim(),
            lastname: input.lastname?.trim(),
        });

        const accessToken = signToken({
            userId: user.id,
            role: user.role.name,
        });
        const refreshToken = await this.buildRefreshToken(user.id, user.role.name);

        return {
            success: true,
            message: "Registration successful",
            data: { ...user, accessToken },
            refreshToken,
        };
    }

    async login(input: LoginInput) {
        const email = input.email.trim().toLowerCase();

        const user = await this.repo.findByEmail(email);
        if (!user) {
            return { success: false, message: "Invalid credentials" };
        }

        const passwordMatch = await bcrypt.compare(input.password, user.password);
        if (!passwordMatch) {
            // To prevent user enumeration, return the same message for both cases
            return { success: false, message: "Invalid credentials" };
        }

        // Exclude password from the returned user data
        const { password: _, ...safeUser } = user;
        const accessToken = signToken({
            userId: user.id,
            role: user.role.name,
        });
        const refreshToken = await this.buildRefreshToken(user.id, user.role.name);

        return {
            success: true,
            message: "Login successful",
            data: { ...safeUser, accessToken },
            refreshToken,
        };
    }

    async refresh(rawToken: string) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const stored = await this.repo.findRefreshToken(tokenHash);

        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            return {
                success: false,
                message: "Invalid or expired refresh token",
            };
        }

        // Verify JWT signature
        const payload = verifyRefreshToken(rawToken);

        // Rotate: revoke old token, issue new one
        await this.repo.revokeRefreshToken(tokenHash);
        const newAccessToken = signToken({
            userId: payload.userId,
            role: payload.role,
        });
        const newRefreshToken = await this.buildRefreshToken(payload.userId, payload.role);

        return {
            success: true,
            data: { accessToken: newAccessToken },
            refreshToken: newRefreshToken,
        };
    }

    async logout(rawToken: string) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        await this.repo.revokeRefreshToken(tokenHash);
        return { success: true, message: "Logged out successfully" };
    }
}
