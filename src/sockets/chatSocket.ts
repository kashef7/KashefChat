import { Server, Socket } from "socket.io";
import prisma from "../prismaClient";
import * as messageServices from "../services/messageServices"

export const onChatJoin = (_io: Server, socket: Socket) => {
  socket.on("joinChat", (data: { chatId: string }) => {
    socket.join(data.chatId);
    console.log(`Joined Room: ${data.chatId}`);
  });
};

export const onSendMessage = (io: Server, socket: Socket) => {
  socket.on("sendMessage", async (data: { chatId: string; content: string; senderId: string; senderName: string }) => {
    try {
      const message = await messageServices.createMessage(data.chatId,data.content,data.senderId);
      io.to(data.chatId).emit("receiveMessage", {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: data.senderName,
        sentAt: message.sentAt
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });
};

export const onDeleteMessage = (io: Server, socket: Socket) => {
  socket.on("deleteMessage", async (data: { messageId: string,chatId: string,senderId: string}) => {
    try {
      await messageServices.deleteMessage(data.messageId,data.senderId)

      io.to(data.chatId).emit("messageDeleted",{
        id: data.messageId,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("messageError", { error: "Failed to delete message" });
    }
  });
};

export const onMarkMessageAsRead = (io: Server, socket: Socket) => {
  socket.on("markMessageAsRead", async (data: { messageId: string, chatId: string }) => {
    try {
      await prisma.message.update({
        where: {
          id: data.messageId
        },
        data: {
          isRead: true
        }
      });

      io.to(data.chatId).emit("messageRead", {
        id: data.messageId
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });
};