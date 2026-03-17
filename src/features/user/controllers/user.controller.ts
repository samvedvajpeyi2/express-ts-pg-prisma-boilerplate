import type { Request, Response } from "express";

import { prisma } from "../../../config/prisma.js";

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
