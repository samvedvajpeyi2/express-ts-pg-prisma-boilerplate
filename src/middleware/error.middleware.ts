import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../errors/app-error.js";

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Convert known Prisma errors into clean HTTP responses instead of raw database errors.
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "Resource already exists",
            });
            return;
        }

        if (err.code === "P2025") {
            res.status(404).json({
                success: false,
                message: "Resource not found",
            });
            return;
        }
    }

    // Convert Zod validation errors into a structured 400 response.
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }

    // Log unexpected errors on the server for debugging.
    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};
