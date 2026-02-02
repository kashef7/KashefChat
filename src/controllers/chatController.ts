import { Request, Response, NextFunction } from "express";
import * as chatServices from "../services/chatServices";

export const startChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await chatServices.startChat(req.user.id, req.body.id);
    res.status(200).json({
      status: "success",
      data: {
        chat: chat
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getChatById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await chatServices.getChatById(req.params.chatId, req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        chat: chat
      }
    });
  } catch (err) {
    next(err);
  }
};