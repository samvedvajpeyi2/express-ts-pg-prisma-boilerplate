import { prisma } from "../../../config/prisma.ts";
import { Request, Response } from "express";

const getUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        include: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });

    res.json(users);
};

export { getUsers };
