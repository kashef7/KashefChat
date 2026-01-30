import { Router } from "express";
import * as authController from "../controllers/authController";
export const router = Router();

router.post("/signUp",authController.signUp);
router.post("/logIn",authController.login);

router.get("/logOut",authController.logOut);
