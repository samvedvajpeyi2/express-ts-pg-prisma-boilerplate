import type { NextFunction, Request, Response } from "express";

import type { RoleName } from "../../generated/prisma/client.js";

export const authorizeMiddleware = (...allowedRoles: RoleName[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: "Forbidden" });
            return;
        }

        next();
    };
};
