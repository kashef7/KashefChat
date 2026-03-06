import { Router } from "express";
import * as authController from "../controllers/authController";
import passport from "passport";
export const router = Router();

router.post("/signUp",authController.signUp);
router.post("/logIn",authController.login);

router.post("/logOut",authController.logOut);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
	"/google/callback",
	passport.authenticate("google", {
		failureRedirect: "/api/v1/auth/google/failure",
		session: false,
	}),
	authController.googleCallback
);

router.get("/google/failure", authController.googleFailure);
