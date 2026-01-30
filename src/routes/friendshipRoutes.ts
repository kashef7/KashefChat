import { Router } from "express";
import * as friendshipController from "../controllers/friendshipController";
import * as authMiddleware from "../middleware/authMiddleware";
export const router = Router();

router.get("/",authMiddleware.protect,friendshipController.getFriends);
router.get("/PendingRequests",authMiddleware.protect,friendshipController.getPendingRequests);