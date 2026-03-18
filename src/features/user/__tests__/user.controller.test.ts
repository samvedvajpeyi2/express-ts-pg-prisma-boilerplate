import type { Request, Response } from "express";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
        // Dynamically import the mocked prisma and the controller after calling vi.mock().
        // Another reason for dynamic import is eslint `import/first` rule,
        // which disallows importing before calling vi.mock().
        const { prisma } = await import("../../../config/prisma.js");
        const { getUsers } = await import("../controllers/user.controller.js");

        // Prepare the fake data the mocked Prisma should return.
        const mockUsers = [{ id: "1", name: "Alice", role: { name: "user" } }];

        // // Add type assertion to access the mocked method with correct typings.
        // type UserPrisma = { user: { findMany: Mock } };
        // const prismaTyped = prisma as unknown as UserPrisma;
        // prismaTyped.user.findMany.mockResolvedValue(mockUsers);
        (prisma.user.findMany as Mock).mockResolvedValue(mockUsers);

        // Use typed Request/Response to minimize `any` usage in tests.
        const req = {} as unknown as Request;
        const res = { json: vi.fn() } as unknown as Response;

        await getUsers(req, res);

        // Assert controller called res.json with the expected payload.
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
});
