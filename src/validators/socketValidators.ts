import { z } from "zod";
import { idSchema, emailSchema } from "./userValidators";


export const contentSchema = z.string().max(3000,"Message cant exceed 3000 characters");

export const sendFriendRequestSchema = z.object({
  receiverEmail: emailSchema,
  senderName: z.string().min(1).max(50),
});

export const respondFriendRequestSchema = z.object({
  senderId: idSchema,
  responderName: z.string().min(1).max(50),
  status: z.enum(["accepted", "rejected"]),
});

export const joinChatSchema = z.object({
  chatId: idSchema,
});

export const sendMessageSchema = z.object({
  chatId: idSchema,
  content: contentSchema,
  senderId: idSchema,
  senderName: z.string().min(1).max(50),
});

export const deleteMessageSchema = z.object({
  messageId: idSchema,
  chatId: idSchema,
  senderId: idSchema,
});

export const markReadSchema = z.object({
  messageId: idSchema,
  chatId: idSchema,
});