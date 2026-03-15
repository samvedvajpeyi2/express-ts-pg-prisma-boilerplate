import bcrypt from "bcryptjs";
import { AuthRepository } from "../repositories/auth.repository.ts";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.ts";

export class AuthService {
    constructor(private readonly repo: AuthRepository) {}

    async register(input: RegisterInput) {
        const email = input.email.trim().toLowerCase();

        const existing = await this.repo.findByEmail(email);
        if (existing) {
            return {
                success: false,
                message: "User already exists with this email",
            };
        }

        const hashedPassword = await bcrypt.hash(input.password, 12);

        const user = await this.repo.createUser({
            email,
            password: hashedPassword,
            firstname: input.firstname?.trim(),
            lastname: input.lastname?.trim(),
        });

        return {
            success: true,
            message: "Registration successful",
            data: user,
        };
    }

    async login(input: LoginInput) {
        const email = input.email.trim().toLowerCase();

        const user = await this.repo.findByEmail(email);
        if (!user) {
            return { success: false, message: "Invalid credentials" };
        }

        const passwordMatch = await bcrypt.compare(
            input.password,
            user.password,
        );
        if (!passwordMatch) {
            return { success: false, message: "Invalid credentials" };
        }

        // Exclude password from returned user data
        const { password: _, ...safeUser } = user;
        return { success: true, message: "Login successful", data: safeUser };
    }
}
