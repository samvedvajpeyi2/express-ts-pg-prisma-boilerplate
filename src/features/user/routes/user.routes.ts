import express from "express";

import { ROLE_NAMES } from "../../../constants/roles.js";
import { authenticateMiddleware } from "../../../middleware/authenticate.middleware.js";
import { authorizeMiddleware } from "../../../middleware/authorize.middleware.js";
import { getUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/all", authenticateMiddleware, authorizeMiddleware(ROLE_NAMES.ADMIN), getUsers);

export default router;
