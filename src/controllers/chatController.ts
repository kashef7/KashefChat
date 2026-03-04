import { Request, Response, NextFunction } from "express";
import * as chatServices from "../services/chatServices";
import * as userValidation from "../validators/userValidators";

export const startChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validUser1Id = userValidation.idSchema.parse(req.user.id);
    const validUser2Id = userValidation.idSchema.parse(req.body.id);
    const chat = await chatServices.startChat(validUser1Id, validUser2Id);
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
    const validUser1Id = userValidation.idSchema.parse(req.user.id);
    const validChatId = userValidation.idSchema.parse(req.params.chatId);
    const chat = await chatServices.getChatById(validChatId, validUser1Id);
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