import express from "express";
import { getUsers } from "../controllers/user.controller.ts";
import { authenticate } from "../../../middleware/authenticate.middleware.ts";
import { authorize } from "../../../middleware/authorize.middleware.ts";
import { ROLE_NAMES } from "../../../constants/roles.ts";

const router = express.Router();

router.get("/all", authenticate, authorize(ROLE_NAMES.ADMIN), getUsers);

export default router;
