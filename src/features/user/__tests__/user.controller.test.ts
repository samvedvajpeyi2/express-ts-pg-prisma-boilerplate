import type { Request, Response } from "express";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Keep imports at top to satisfy ESLint `import/first`.
// Declare the module mock here; we'll import the controller after to ensure
// the controller receives the mocked prisma instance.
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
    // Clear all mock call information before each test to avoid leakage.
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("responds with users from Prisma", async () => {
        // Dynamically import the mocked prisma and the controller after calling vi.mock().
        const { prisma } = await import("../../../config/prisma.js");
        const { getUsers } = await import("../controllers/user.controller.js");

        // Prepare the fake data the mocked Prisma should return.
        const mockUsers = [{ id: "1", name: "Alice", role: { name: "user" } }];

        // Replace the mocked function with a new mock that resolves the value.
        // Cast `prisma` to a narrow typed shape to avoid `any` and unsafe-member-access lint errors.
        type UserPrisma = { user: { findMany: Mock } };
        const prismaTyped = prisma as unknown as UserPrisma;
        prismaTyped.user.findMany.mockResolvedValue(mockUsers);

        // Use typed Request/Response to minimize `any` usage in tests.
        const req = {} as unknown as Request;
        const res = { json: vi.fn() } as unknown as Response;

        await getUsers(req, res);

        // Assert controller called res.json with the expected payload.
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });
});
