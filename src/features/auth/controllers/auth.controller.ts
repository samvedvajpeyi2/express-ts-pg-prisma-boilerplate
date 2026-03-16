import type { Request, Response } from "express";

import { env } from "../../../config/env-config.js";
import { parseDurationMs } from "../../../utils/time.util.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import type { AuthService } from "../services/auth.service.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const setRefreshTokenCookie = (res: Response, token: string): void => {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN),
    });
};

const clearRefreshTokenCookie = (res: Response): void => {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
    });
};

const getRefreshTokenFromRequest = (req: Request): string | undefined => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const rawCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

    if (!rawCookie) return undefined;

    return decodeURIComponent(rawCookie.split("=")[1]);
};

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = async (req: Request, res: Response) => {
        const result = await this.authService.register(req.body as RegisterInput);

        if (!result.success) {
            res.status(409).json(result);
            return;
        }

        setRefreshTokenCookie(res, result.refreshToken!);
        const { refreshToken: _, ...responseBody } = result;
        res.status(201).json(responseBody);
    };

    login = async (req: Request, res: Response) => {
        const result = await this.authService.login(req.body as LoginInput);
        if (!result.success) {
            res.status(401).json(result);
            return;
        }

        setRefreshTokenCookie(res, result.refreshToken!);
        const { refreshToken: _, ...responseBody } = result;
        res.status(200).json(responseBody);
    };

    refresh = async (req: Request, res: Response) => {
        const refreshToken = getRefreshTokenFromRequest(req);
        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: "Refresh token not found",
            });
            return;
        }

        const result = await this.authService.refresh(refreshToken);
        if (!result.success) {
            clearRefreshTokenCookie(res);
            res.status(401).json(result);
            return;
        }

        setRefreshTokenCookie(res, result.refreshToken!);
        const { refreshToken: _, ...responseBody } = result;
        res.status(200).json(responseBody);
    };

    logout = async (req: Request, res: Response) => {
        const refreshToken = getRefreshTokenFromRequest(req);
        clearRefreshTokenCookie(res);

        if (!refreshToken) {
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
            return;
        }

        const result = await this.authService.logout(refreshToken);
        res.status(200).json(result);
    };
}
