import { Router } from "express";
import * as userController from "../controllers/userController";
import * as authMiddleware from "../middleware/authMiddleware";

export const router = Router();

router.get("/allNameEmail",authMiddleware.protect,userController.getAllUsersNameEmail);