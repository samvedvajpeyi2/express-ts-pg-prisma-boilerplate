import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoleName } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { getUsers } from "../controllers/user.controller.js";

vi.mock("../../../config/prisma.js", () => {
    return {
        prisma: {
            user: {
                findMany: vi.fn(),
            },
        },
    };
});

describe("getUsers controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("responds with users from Prisma", async () => {
        // Prepare the fake data the mocked Prisma should return.
        const mockUsers = [
            {
                id: 1,
                email: "alice@example.com",
                password: "hashed-password",
                firstname: "Alice",
                lastname: null,
                roleId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                active: true,
                role: { name: "USER" as RoleName },
            },
        ];

        vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

        // Use typed Request/Response to minimize `any` usage in tests.
        const req = {} as unknown as Request;
        const res = { json: vi.fn() } as unknown as Response;

        await getUsers(req, res);

        // Assert controller called res.json with the expected payload.
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
});
