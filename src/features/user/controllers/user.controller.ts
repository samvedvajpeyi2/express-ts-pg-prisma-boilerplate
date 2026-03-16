import type { Request, Response } from "express";

import { prisma } from "../../../config/prisma.js";

const getUsers = async (req: Request, res: Response) => {
    // throw a test error to verify that our global error handler works
    throw new Error("Test error from getUsers controller");
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
