import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import * as authRoutes from "./routes/authRoutes";
import * as userRoutes from "./routes/userRoutes";
import * as friendshipRoutes from "./routes/friendshipRoutes";
import * as chatRoutes from "./routes/chatRoutes";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
export const app = express();


const limiter = rateLimit({
   windowMs: 15 * 60 * 1000,
  max: 100, 
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})


app.use(limiter);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

app.use("/api/v1/auth",authRoutes.router);
app.use("/api/v1/user",userRoutes.router);
app.use("/api/v1/friendship",friendshipRoutes.router);
app.use("/api/v1/chat",chatRoutes.router);

app.use(errorHandler);
