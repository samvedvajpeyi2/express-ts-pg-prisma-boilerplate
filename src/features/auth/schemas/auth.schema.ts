import { z } from "zod";

const invalidEmailMessage = "Invalid email address.";
const passwordMinLengthMessage = "Password must be at least 8 characters long.";
const passwordMaxLengthMessage = "Password must be at most 72 characters long.";

export const registerSchema = z.object({
    email: z.email({ message: invalidEmailMessage }),
    password: z
        .string()
        .min(8, { message: passwordMinLengthMessage })
        .max(72, { message: passwordMaxLengthMessage }),
    firstname: z.string().min(1).max(50).optional(),
    lastname: z.string().min(1).max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z.email({ message: invalidEmailMessage }),
    password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
