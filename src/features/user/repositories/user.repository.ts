import type { PrismaClient } from "../../../../generated/prisma/client.js";

export class UserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findAll() {
        return this.prisma.user.findMany({
            include: {
                role: {
                    select: { name: true },
                },
            },
        });
    }
}
