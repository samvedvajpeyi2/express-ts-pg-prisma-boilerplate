import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "../utils/jwt.util.js";

export const authenticateMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "No token provided" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = verifyToken(token);
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
