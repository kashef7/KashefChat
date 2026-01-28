import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
export const app = express();

app.use(express.json());
app.use(cookieParser());


app.use(errorHandler);
