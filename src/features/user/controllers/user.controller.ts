import type { Request, Response } from "express";

import type { UserService } from "../services/user.service.js";

export class UserController {
    constructor(private readonly userService: UserService) {}

    getUsers = async (_req: Request, res: Response) => {
        const users = await this.userService.getUsers();
        res.json(users);
    };
}
