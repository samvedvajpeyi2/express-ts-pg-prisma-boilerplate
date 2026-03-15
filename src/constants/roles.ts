import { RoleName } from "../../generated/prisma/client.js";

export const ROLE_NAMES = {
    ADMIN: RoleName.ADMIN,
    USER: RoleName.USER,
} as const;

export const DEFAULT_ROLE_NAME = ROLE_NAMES.USER;
