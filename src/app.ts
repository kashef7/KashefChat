import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import * as authRoutes from "./routes/authRoutes";
export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users",authRoutes.router);

app.use(errorHandler);
