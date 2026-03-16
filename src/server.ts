import type { Server } from "node:http";

import type { Application, NextFunction, Request, Response } from "express";
import express from "express";

// import type { Request, Response, NextFunction } from "express";
import { env } from "./config/env-config.js";
import { prisma } from "./config/prisma.js";
import authRoutes from "./features/auth/routes/auth.routes.js";
import userRoutes from "./features/user/routes/user.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import {
    checkJsonContentTypeMiddleware,
    unmatchedRoutesMiddleware,
} from "./middleware/request-guard.middleware.js";
import {
    hostWhitelistMiddleware,
    rateLimiterMiddleware,
} from "./middleware/security.middleware.js";

const app: Application = express();
const PORT: number = env.PORT;

app.use(rateLimiterMiddleware);
app.use(hostWhitelistMiddleware(env.WHITE_LIST_URLS));
app.use(checkJsonContentTypeMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Delete later, this was test
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} http://${req.headers.host}${req.url}`);
    next();
});

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, world! This is the server.js file, or is it?");
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

app.use(unmatchedRoutesMiddleware);

app.use(errorMiddleware);

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
