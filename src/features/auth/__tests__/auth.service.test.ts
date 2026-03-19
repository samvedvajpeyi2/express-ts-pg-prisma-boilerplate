import bcrypt from "bcryptjs";
import crypto from "crypto";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import type { RoleName } from "../../../../generated/prisma/client.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import { AuthService } from "../services/auth.service.js";

// Mock external utilities (pure functions/modules)
vi.mock("../../../utils/jwt.util.js", () => ({
    signToken: vi.fn(
        (payload: { userId: number; role: RoleName }) => `access-token-for-${payload.userId}`,
    ),
    signRefreshToken: vi.fn(
        (payload: { userId: number; role: RoleName }) => `refresh-raw-${payload.userId}`,
    ),
    verifyRefreshToken: vi.fn((token: string) => {
        if (token.startsWith("refresh-raw-")) {
            const userId = Number(token.split("-")[2]);
            return { userId, role: "USER" as RoleName };
        }
        throw new Error("invalid");
    }),
}));

vi.mock("../../../utils/time.util.js", () => ({
    parseDurationMs: vi.fn(() => 7 * 24 * 60 * 60 * 1000), // 7 days
}));

vi.mock("bcryptjs", () => {
    return {
        default: {
            hash: vi.fn().mockImplementation((pw: string) => `hashed-${pw}`),
            compare: vi
                .fn()
                .mockImplementation(
                    (plain: string, hash: string) => plain === hash.replace("hashed-", ""),
                ),
        },
    };
});

describe("AuthService (unit)", () => {
    let service: AuthService;
    let mockRepo: Mocked<AuthRepository>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepo = {
            findByEmail: vi.fn(),
            createUser: vi.fn(),
            createRefreshToken: vi.fn(),
            findRefreshToken: vi.fn(),
            revokeRefreshToken: vi.fn(),
        } as unknown as Mocked<AuthRepository>;

        service = new AuthService(mockRepo);
    });

    describe("register", () => {
        it("creates new user when email not taken", async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            mockRepo.createUser.mockResolvedValue({
                id: 42,
                email: "test@example.com",
                firstname: "Test",
                lastname: "User",
                role: { name: "USER" as RoleName },
                createdAt: new Date(),
            });

            const result = await service.register({
                email: "  Test@Example.com  ",
                password: "123456",
                firstname: " Test ",
                lastname: " User ",
            });

            expect(result.success).toBe(true);
            expect(result.message).toBe("Registration successful");
            expect(result.data?.id).toBe(42);
            expect(result.data?.accessToken).toBe("access-token-for-42");
            expect(result.refreshToken).toBe("refresh-raw-42");

            expect(mockRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
            expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith("123456", 12);
            expect(mockRepo.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: "test@example.com",
                    password: "hashed-123456",
                    firstname: "Test",
                    lastname: "User",
                }),
            );
        });

        it("rejects duplicate email", async () => {
            mockRepo.findByEmail.mockResolvedValue({
                id: 1,
                email: "",
                password: "",
                firstname: null,
                lastname: null,
                role: { name: "USER" as RoleName },
            });

            const result = await service.register({
                email: "exists@example.com",
                password: "123456",
            });

            expect(result.success).toBe(false);
            expect(result.message).toBe("User already exists with this email");
            expect(mockRepo.createUser).not.toHaveBeenCalled();
        });
    });

    describe("login", () => {
        it("successful login returns tokens and safe user", async () => {
            mockRepo.findByEmail.mockResolvedValue({
                id: 42,
                email: "test@example.com",
                password: "hashed-123456",
                firstname: "Test",
                lastname: null,
                role: { name: "USER" as RoleName },
            });

            const result = await service.login({
                email: "test@example.com",
                password: "123456",
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(42);
            expect(result.data?.accessToken).toBe("access-token-for-42");
            expect(result.refreshToken).toBe("refresh-raw-42");
            expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledWith("123456", "hashed-123456");
        });

        it("returns error for non-existing user", async () => {
            mockRepo.findByEmail.mockResolvedValue(null);

            const result = await service.login({ email: "nope@example.com", password: "123" });

            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid credentials");
        });

        it("returns same error for wrong password (prevents user enumeration)", async () => {
            mockRepo.findByEmail.mockResolvedValue({
                id: 1,
                email: "exists@example.com",
                password: "hashed-somepassword",
                firstname: null,
                lastname: null,
                role: { name: "USER" as RoleName },
            });

            const result = await service.login({ email: "exists@example.com", password: "wrong" });

            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid credentials");
        });
    });

    describe("refresh", () => {
        it("rotates valid refresh token", async () => {
            const rawToken = "refresh-raw-42";
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

            mockRepo.findRefreshToken.mockResolvedValue({
                id: 1,
                tokenHash: "irrelevant",
                createdAt: new Date(),
                userId: 42,
                revokedAt: null,
                expiresAt: new Date(Date.now() + 86400000),
            });

            const result = await service.refresh(rawToken);

            expect(result.success).toBe(true);
            expect(result.data?.accessToken).toBe("access-token-for-42");
            expect(result.refreshToken).toBe("refresh-raw-42"); // new rotated token

            expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith(tokenHash);
            expect(mockRepo.createRefreshToken).toHaveBeenCalled();
        });

        it("rejects expired refresh token", async () => {
            mockRepo.findRefreshToken.mockResolvedValue({
                id: 1,
                tokenHash: "irrelevant",
                createdAt: new Date(),
                userId: 1,
                revokedAt: null,
                expiresAt: new Date(Date.now() - 1000),
            });

            const result = await service.refresh("old-token");

            expect(result.success).toBe(false);
        });

        it("rejects revoked refresh token", async () => {
            mockRepo.findRefreshToken.mockResolvedValue({
                id: 1,
                tokenHash: "irrelevant",
                createdAt: new Date(),
                userId: 1,
                revokedAt: new Date(),
                expiresAt: new Date(Date.now() + 86400000),
            });

            const result = await service.refresh("revoked-token");

            expect(result.success).toBe(false);
        });

        it("throws for invalid JWT signature", async () => {
            // Token is found in DB but JWT signature verification fails
            mockRepo.findRefreshToken.mockResolvedValue({
                id: 1,
                tokenHash: "irrelevant",
                createdAt: new Date(),
                userId: 1,
                revokedAt: null,
                expiresAt: new Date(Date.now() + 86400000),
            });

            await expect(service.refresh("bad-signature")).rejects.toThrow(/invalid/);
        });
    });

    describe("logout", () => {
        it("revokes refresh token", async () => {
            const raw = "refresh-raw-100";
            const hash = crypto.createHash("sha256").update(raw).digest("hex");

            const result = await service.logout(raw);

            expect(result.success).toBe(true);
            expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith(hash);
        });
    });
});
