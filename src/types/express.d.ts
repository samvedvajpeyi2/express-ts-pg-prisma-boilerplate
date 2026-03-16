import type { JwtPayload } from "../utils/jwt.util.js";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export {};
