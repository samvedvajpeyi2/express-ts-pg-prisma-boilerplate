import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Middleware
 *
 * This middleware limits the number of requests a client can make to the server within a specified time window. It helps protect against brute-force attacks and abuse by restricting the rate at which clients can access the server's resources. In this implementation, each IP address is limited to 100 requests per 15-minute window. If a client exceeds this limit, they will receive a 429 Too Many Requests response with a message indicating that they should try again later.
 */

export const rateLimiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
});

/**
 *
 * @param allowedUrls - List of allowed origins (e.g., ["http://localhost:3000", "https://myapp.com"])
 * @returns Middleware function that checks the Origin header against the allowed URLs and either allows the request to proceed or responds with a 403 Forbidden status.
 *
 * This middleware is useful for preventing unauthorized cross-origin requests by ensuring that only requests from specified origins are allowed to access the server's resources. It checks the Origin header of incoming requests and compares it against a whitelist of allowed URLs. If the Origin header is missing or does not match any of the allowed URLs, the middleware responds with an appropriate error message and status code.
 */
export const hostWhitelistMiddleware = (allowedUrls: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const origin = req.headers.origin;

        if (!origin) {
            // Non-browser clients (Postman/curl/server-to-server) may not send Origin.
            // In that case we allow the request to continue.
            // This current setting is for my development convenience currently,

            // TODO: Remember to remove this in production and un-comment the code below to enforce Origin header check.
            next();
            return;

            // TODO: UN-COMMENT THIS IN PRODUCTION (and remove the above lines that allow requests without Origin header)
            // res.status(400).json({
            //     success: false,
            //     message: "Origin header is missing",
            // });
            // return;
        }

        if (!allowedUrls.includes(origin)) {
            res.status(403).json({
                success: false,
                message: "Access forbidden",
            });
            return;
        }

        next();
    };
};
