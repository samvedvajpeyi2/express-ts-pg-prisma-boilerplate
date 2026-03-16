import type { Application, NextFunction, Request, Response } from "express";
import express from "express";

// import type { Request, Response, NextFunction } from "express";
import { env } from "./config/env-config.ts";
import authRoutes from "./features/auth/routes/auth.routes.ts";
import userRoutes from "./features/user/routes/user.routes.ts";
import { errorMiddleware } from "./middleware/error.middleware.ts";
import {
    checkJsonContentTypeMiddleware,
    unmatchedRoutesMiddleware,
} from "./middleware/request-guard.middleware.ts";
import {
    hostWhitelistMiddleware,
    rateLimiterMiddleware,
} from "./middleware/security.middleware.ts";

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
