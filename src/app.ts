import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import * as authRoutes from "./routes/authRoutes";
import * as userRoutes from "./routes/userRoutes";
import * as friendshipRoutes from "./routes/friendshipRoutes";
export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth",authRoutes.router);
app.use("/api/v1/user",userRoutes.router);
app.use("/api/v1/friendship",friendshipRoutes.router);

app.use(errorHandler);
