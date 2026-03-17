// import { describe, it, expect, vi, beforeEach } from "vitest";

// // Replace the real Prisma import with a mock so tests never hit the database.
// // This keeps the test fast and deterministic.
// vi.mock("../../../config/prisma.js", () => {
//     return {
//         prisma: {
//             user: {
//                 findMany: vi.fn(),
//             },
//         },
//     };
// });

// import { getUsers } from "../controllers/user.controller.js";
// import { prisma } from "../../../config/prisma.js";

// describe("getUsers controller", () => {
//     // Clear all mock call information before each test to avoid leakage.
//     beforeEach(() => {
//         vi.clearAllMocks();
//     });

//     it("responds with users from Prisma", async () => {
//         // Prepare the fake data the mocked Prisma should return.
//         const mockUsers = [{ id: "1", name: "Alice", role: { name: "user" } }];

//         // Tell the mocked `prisma.user.findMany` what to resolve with when called.
//         // `mockResolvedValue` makes the mock return a resolved Promise with this value.
//         (prisma.user.findMany as any).mockResolvedValue(mockUsers);

//         // Create fake `req` and `res` objects. `res.json` is a mock function
//         // so we can assert it was called with the expected value.
//         const req = {} as any;
//         const res = { json: vi.fn() } as any;

//         await getUsers(req, res);

//         // `toHaveBeenCalledWith` asserts that the mock function was called
//         // with the specific argument (`mockUsers`) — this verifies output.
//         expect(res.json).toHaveBeenCalledWith(mockUsers);
//     });
// });
