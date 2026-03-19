import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { DEFAULT_ROLE_NAME } from "../../../constants/roles.js";

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
                role: { select: { name: true } },
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

    async createRefreshToken(data: { userId: number; tokenHash: string; expiresAt: Date }) {
        return this.prisma.refreshToken.create({
            data: {
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
            },
        });
    }

    async findRefreshToken(tokenHash: string) {
        return this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
    }

    async revokeRefreshToken(tokenHash: string) {
        return this.prisma.refreshToken.update({
            where: { tokenHash },
            data: { revokedAt: new Date() },
        });
    }
}
