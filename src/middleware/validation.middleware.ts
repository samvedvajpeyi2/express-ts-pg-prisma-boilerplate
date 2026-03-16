import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export const validateRequestMiddleware = (schema: z.ZodType<unknown>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const validationResult = schema.safeParse(req.body);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map((err) => ({
                path: err.path.join("."),
                message: err.message,
            }));

            res.status(400).json({
                success: false,
                message: "Validation error",
                errors: errorMessages,
            });
            return;
        }

        req.body = validationResult.data;
        next();
    };
};
