import { Router } from "express";

import { prisma } from "../../../config/prisma.js";
import { ROLE_NAMES } from "../../../constants/roles.js";
import { authenticateMiddleware } from "../../../middleware/authenticate.middleware.js";
import { authorizeMiddleware } from "../../../middleware/authorize.middleware.js";
import { UserController } from "../controllers/user.controller.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "../services/user.service.js";

const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

router.get(
    "/all",
    authenticateMiddleware,
    authorizeMiddleware(ROLE_NAMES.ADMIN),
    userController.getUsers,
);
router.get("/test", userController.getUsers);

export const userRouter = router;
