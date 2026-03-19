import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import type { RoleName } from "../../../../generated/prisma/client.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.service.js";

describe("UserService (unit)", () => {
    let service: UserService;
    let mockRepo: Mocked<UserRepository>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepo = {
            findAll: vi.fn(),
        } as unknown as Mocked<UserRepository>;

        service = new UserService(mockRepo);
    });

    describe("getUsers", () => {
        it("returns all users from repository", async () => {
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

            mockRepo.findAll.mockResolvedValue(mockUsers);

            const result = await service.getUsers();

            expect(result).toEqual(mockUsers);
            expect(mockRepo.findAll).toHaveBeenCalled();
        });
    });
});
