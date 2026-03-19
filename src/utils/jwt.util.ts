import crypto from "crypto";
import jwt from "jsonwebtoken";

import type { RoleName } from "../../generated/prisma/client.js";
import { env } from "../config/env-config.js";

export type JwtPayload = {
    userId: number;
    role: RoleName;
};

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const signRefreshToken = (payload: JwtPayload): string => {
    // jti (JWT ID) adds a random unique identifier so two tokens signed within
    // the same second produce different hashes — preventing P2002 on createRefreshToken.
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.REFRESH_TOKEN_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
};

export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
};
