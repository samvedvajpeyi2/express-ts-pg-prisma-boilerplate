import type { NextFunction, Request, Response } from "express";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const checkJsonContentTypeMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (!METHODS_WITH_BODY.has(req.method)) {
        next();
        return;
    }

    const contentType = req.headers["content-type"];
    if (!contentType?.startsWith("application/json")) {
        res.status(400).json({
            success: false,
            message: "Only application/json Content-Type is allowed",
        });
        return;
    }

    next();
};

export const unmatchedRoutesMiddleware = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
};
