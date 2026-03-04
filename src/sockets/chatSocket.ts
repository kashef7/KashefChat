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
      console.log(`Joined Room: ${parsed.chatId}`);
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
        parsed.senderId
      );

      io.to(parsed.chatId).emit("receiveMessage", {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: parsed.senderName,
        sentAt: message.sentAt
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

export const onMarkMessageAsRead = (io: Server, socket: Socket) => {
  socket.on("markMessageAsRead", async (data) => {
    try {
      const parsed = markReadSchema.parse(data);

      await prisma.message.update({
        where: { id: parsed.messageId },
        data: { isRead: true }
      });

      io.to(parsed.chatId).emit("messageRead", {
        id: parsed.messageId
      });

    } catch (error) {
      socket.emit("messageError", { error: "Invalid read request" });
    }
  });
};