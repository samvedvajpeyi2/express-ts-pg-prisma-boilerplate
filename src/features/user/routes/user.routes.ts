import express from "express";

import { ROLE_NAMES } from "../../../constants/roles.ts";
import { authenticateMiddleware } from "../../../middleware/authenticate.middleware.ts";
import { authorizeMiddleware } from "../../../middleware/authorize.middleware.ts";
import { getUsers } from "../controllers/user.controller.ts";

const router = express.Router();

router.get("/all", authenticateMiddleware, authorizeMiddleware(ROLE_NAMES.ADMIN), getUsers);

export default router;
