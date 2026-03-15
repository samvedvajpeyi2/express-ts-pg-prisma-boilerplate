import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.ts";
import { env } from "../../../config/env-config.ts";
import { parseDurationMs } from "../../../utils/time.util.ts";

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

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.register(req.body);

            if (!result.success) {
                res.status(409).json(result);
                return;
            }

            setRefreshTokenCookie(res, result.refreshToken!);
            const { refreshToken: _, ...responseBody } = result;
            res.status(201).json(responseBody);
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.login(req.body);
            if (!result.success) {
                res.status(401).json(result);
                return;
            }
            setRefreshTokenCookie(res, result.refreshToken!);
            const { refreshToken: _, ...responseBody } = result;
            res.status(200).json(responseBody);
        } catch (error) {
            next(error);
        }
    };

    refresh = async (req: Request, res: Response, next: NextFunction) => {
        try {
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
        } catch (error) {
            next(error);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
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
        } catch (error) {
            next(error);
        }
    };
}
