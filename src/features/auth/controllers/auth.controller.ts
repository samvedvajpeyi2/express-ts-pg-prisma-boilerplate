import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.ts";

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.register(req.body);

            if (!result.success) {
                res.status(409).json(result);
                return;
            }

            res.status(201).json(result);
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
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
