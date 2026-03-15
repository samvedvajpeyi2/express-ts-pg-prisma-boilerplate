import { Router } from "express";
import { prisma } from "../../../config/prisma.ts";
import { validateRequest } from "../../../middleware/validation.middleware.ts";
import { AuthController } from "../controllers/auth.controller.ts";
import { AuthRepository } from "../repositories/auth.repository.ts";
import { loginSchema, registerSchema } from "../schemas/auth.schema.ts";
import { AuthService } from "../services/auth.service.ts";

const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = Router();

router.post(
    "/register",
    validateRequest(registerSchema),
    authController.register,
);

router.post("/login", validateRequest(loginSchema), authController.login);

export default router;
