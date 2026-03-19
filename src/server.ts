import type { Server } from "node:http";

import type { Application } from "express";
import express from "express";

import { env } from "./config/env-config.js";
import { prisma } from "./config/prisma.js";
import { authRouter } from "./features/auth/routes/auth.routes.js";
import { userRouter } from "./features/user/routes/user.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import {
    checkJsonContentTypeMiddleware,
    unmatchedRoutesMiddleware,
} from "./middleware/request-guard.middleware.js";
import {
    hostWhitelistMiddleware,
    rateLimiterMiddleware,
} from "./middleware/security.middleware.js";

export function createApp(): Application {
    const app: Application = express();

    // Skip rate limiter in test mode — it holds state that bleeds between tests
    if (env.NODE_ENV !== "test") {
        app.use(rateLimiterMiddleware);
    }
    app.use(hostWhitelistMiddleware(env.WHITE_LIST_URLS));
    app.use(checkJsonContentTypeMiddleware);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/users", userRouter);
    app.use("/auth", authRouter);

    app.use(unmatchedRoutesMiddleware);
    app.use(errorMiddleware);

    return app;
}

const app = createApp();
const PORT: number = env.PORT;

const server: Server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let isShuttingDown = false;

const gracefulShutdown = (signal: string): void => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[Shutdown] Received ${signal}. Closing server...`);

    server.close((error?: Error) => {
        if (error) {
            console.error("[Shutdown] Error while closing HTTP server:", error);
            process.exit(1);
            return;
        }

        void prisma
            .$disconnect()
            .then(() => {
                console.log("[Shutdown] Prisma disconnected. Exiting.");
                process.exit(0);
            })
            .catch((disconnectError) => {
                console.error("[Shutdown] Prisma disconnect failed:", disconnectError);
                process.exit(1);
            });
    });
};

process.on("SIGINT", () => {
    gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM");
});
