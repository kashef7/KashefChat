import { Router } from "express";
import * as userController from "../controllers/userController";
import * as authMiddleware from "../middleware/authMiddleware";

export const router = Router();

router.get("/me", authMiddleware.protect, userController.getMe);
router.get("/allNameEmail", authMiddleware.protect, userController.getAllUsersNameEmail);
router.get("/userByNameOrEmail", authMiddleware.protect, userController.searchForUser);
router.patch("/updateGoogleUser", authMiddleware.protect, userController.updateGoogleUser);