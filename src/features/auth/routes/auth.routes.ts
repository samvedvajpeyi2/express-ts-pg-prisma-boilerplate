import { Router } from "express";

import { prisma } from "../../../config/prisma.js";
import { validateRequestMiddleware } from "../../../middleware/validation.middleware.js";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { AuthService } from "../services/auth.service.js";

const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = Router();

router.post("/register", validateRequestMiddleware(registerSchema), authController.register);

router.post("/login", validateRequestMiddleware(loginSchema), authController.login);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

export const authRouter = router;
