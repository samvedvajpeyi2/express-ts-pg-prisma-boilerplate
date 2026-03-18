import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoleName } from "../../../../generated/prisma/client.js";
import type { AuthRepository } from "../repositories/auth.repository.js";
import { AuthService } from "../services/auth.service.js";

// Mock external utilities (pure functions/modules)
vi.mock("../../../utils/jwt.util.js", () => ({
    // add type for payload to get better type safety in tests
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

// vi.spyOn(bcrypt, "hash").mockImplementation((pw) => `hashed-${pw}`);
// vi.spyOn(bcrypt, "compare").mockImplementation(
//     (plain, hash) => plain === hash.replace("hashed-", ""),
// );

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
    // let mockRepo: AuthRepository;
    let mockRepo: {
        findByEmail: Mock;
        createUser: Mock;
        createRefreshToken: Mock;
        findRefreshToken: Mock;
        revokeRefreshToken: Mock;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepo = {
            findByEmail: vi.fn(),
            createUser: vi.fn(),
            createRefreshToken: vi.fn(),
            findRefreshToken: vi.fn(),
            revokeRefreshToken: vi.fn(),
        } as unknown as AuthRepository;

        service = new AuthService(mockRepo);
    });

    describe("register", () => {
        it("creates new user when email not taken", async () => {
            mockRepo.findByEmail.mockResolvedValue(null);
            mockRepo.createUser.mockResolvedValue({
                id: 42,
                email: "test@example.com",
                password: "hashed-123456",
                firstname: "Test",
                lastname: "User",
                role: { name: "USER" as RoleName },
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
            expect(bcrypt.hash).toHaveBeenCalledWith("123456", 12);
            // expect(vi.mocked(bcrypt.hash)).toHaveBeenCalledWith("123456", 12);
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
            mockRepo.findByEmail.mockResolvedValue({ id: 1 });

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
                role: { name: "USER" as RoleName },
            });

            const result = await service.login({
                email: "test@example.com",
                password: "123456",
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe(42);
            expect(result.data?.password).toBeUndefined();
            expect(result.data?.accessToken).toBe("access-token-for-42");
            expect(result.refreshToken).toBe("refresh-raw-42");
            expect(bcrypt.compare).toHaveBeenCalledWith("123456", "hashed-123456");
            // expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledWith("123456", "hashed-123456");
        });

        it("returns same error for wrong password OR non-existing user", async () => {
            // non-existing
            mockRepo.findByEmail.mockResolvedValue(null);
            let result = await service.login({ email: "nope", password: "123" });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid credentials");

            // wrong password

            mockRepo.findByEmail.mockResolvedValue({
                id: 1,
                password: "password",
                role: { name: "USER" as RoleName },
            });

            result = await service.login({ email: "exists", password: "wrong-password" });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid credentials");
        });
    });

    describe("refresh", () => {
        it("rotates valid refresh token", async () => {
            const rawToken = "refresh-raw-42";
            const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

            mockRepo.findRefreshToken.mockResolvedValue({
                userId: 42,
                revokedAt: null,
                expiresAt: new Date(Date.now() + 86400000),
            });

            const result = await service.refresh(rawToken);

            expect(result.success).toBe(true);
            expect(result.data?.accessToken).toBe("access-token-for-42");
            expect(result.refreshToken).toBe("refresh-raw-42"); // new one

            expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith(tokenHash);
            expect(mockRepo.createRefreshToken).toHaveBeenCalled();
        });

        it("rejects expired / revoked / invalid token", async () => {
            // expired
            mockRepo.findRefreshToken.mockResolvedValue({
                revokedAt: null,
                expiresAt: new Date(Date.now() - 1000),
            });
            let r = await service.refresh("old");
            expect(r.success).toBe(false);

            // revoked

            mockRepo.findRefreshToken.mockResolvedValue({ revokedAt: new Date() });
            r = await service.refresh("revoked");
            expect(r.success).toBe(false);

            // invalid signature → verify throws

            mockRepo.findRefreshToken.mockResolvedValue({});
            // r = await service.refresh("bad-signature");
            // expect(r.success).toBe(false);
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
