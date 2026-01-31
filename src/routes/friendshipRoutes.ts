import { Router } from "express";
import * as friendshipController from "../controllers/friendshipController";
import * as authMiddleware from "../middleware/authMiddleware";
export const router = Router();

router.get("/",authMiddleware.protect,friendshipController.getFriends);
router.get("/PendingRequests",authMiddleware.protect,friendshipController.getPendingRequests);
router.get("/PendingRequestsReceived",authMiddleware.protect,friendshipController.getPendingRequestsReceived);

router.post("/sendFriendRequest",authMiddleware.protect,friendshipController.sendFriendRequest);
router.post("/respondToRequest",authMiddleware.protect,friendshipController.respondToRequest);
router.delete("/removeFriend",authMiddleware.protect,friendshipController.removeFriend);