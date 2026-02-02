import { Router } from "express";
import * as chatController from "../controllers/chatController";
import * as authMiddleware from "../middleware/authMiddleware";
export const router = Router();

router.post("/startChat", authMiddleware.protect, chatController.startChat);
router.get("/:chatId", authMiddleware.protect, chatController.getChatById);

