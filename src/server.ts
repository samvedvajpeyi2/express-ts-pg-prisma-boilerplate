import express, { Application, Request, Response, NextFunction } from "express";
// import type { Request, Response, NextFunction } from "express";
import { env } from "./config/env-config.ts";
import userRoutes from "./features/user/routes/user.routes.ts";

const app: Application = express();
const PORT: number = env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Delete later, this was test
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} http://${req.headers.host}${req.url}`);
    next();
});

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.send("Hello, world! This is the server.js file, or is it?");
});

app.use("/users", userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
