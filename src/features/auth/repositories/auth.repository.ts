import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { DEFAULT_ROLE_NAME } from "../../../constants/roles.ts";

export class AuthRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstname: true,
                lastname: true,
                roleId: true,
            },
        });
    }

    async createUser(data: {
        email: string;
        password: string;
        firstname?: string;
        lastname?: string;
    }) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstname: data.firstname,
                lastname: data.lastname,
                role: {
                    connect: {
                        name: DEFAULT_ROLE_NAME,
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
                role: { select: { name: true } },
                createdAt: true,
            },
        });
    }
}
