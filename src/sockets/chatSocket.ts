import { Server, Socket } from "socket.io";
import prisma from "../prismaClient";
import * as messageServices from "../services/messageServices";
import {
  joinChatSchema,
  sendMessageSchema,
  deleteMessageSchema,
  markReadSchema
} from "../validators/socketValidators";

export const onChatJoin = (_io: Server, socket: Socket) => {
  socket.on("joinChat", (data) => {
    try {
      const parsed = joinChatSchema.parse(data);
      socket.join(parsed.chatId);
    } catch {
      socket.emit("messageError", { error: "Invalid chatId" });
    }
  });
};

export const onSendMessage = (io: Server, socket: Socket) => {
  socket.on("sendMessage", async (data) => {
    try {
      const parsed = sendMessageSchema.parse(data);

      const message = await messageServices.createMessage(
        parsed.chatId,
        parsed.content,
        parsed.senderId,
        parsed.iv,
        parsed.keys
      );

      io.to(parsed.chatId).emit("receiveMessage", {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: parsed.senderName,
        sentAt: message.sentAt,
        iv: message.iv,
        keys: parsed.keys
      });

    } catch (error) {
      socket.emit("messageError", { error: "Invalid message data" });
    }
  });
};

export const onDeleteMessage = (io: Server, socket: Socket) => {
  socket.on("deleteMessage", async (data) => {
    try {
      const parsed = deleteMessageSchema.parse(data);

      await messageServices.deleteMessage(parsed.messageId, parsed.senderId);

      io.to(parsed.chatId).emit("messageDeleted", {
        id: parsed.messageId
      });

    } catch (error) {
      socket.emit("messageError", { error: "Invalid delete request" });
    }
  });
};
export const onTyping = (io: Server, socket: Socket) => {
  socket.on("typing", async (data) => {
    try {
      // emit to the chat room but NOT back to the sender
      socket.to(data.chatId).emit("typing", { userId: data.userId });
    } catch (err) {
      socket.emit("messageError", { error: "Invalid typing indicator" });
    }
  });

  socket.on("stopTyping", async (data) => {
    try {
      socket.to(data.chatId).emit("stopTyping", { userId: data.userId });
    } catch (err) {}
  });
};