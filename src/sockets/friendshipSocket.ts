import { Server, Socket } from "socket.io";
import * as userRepo from "../repositories/userRepo";
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema
} from "../validators/socketValidators";

export const onFriendRequestSent = (io: Server, socket: Socket) => {
  socket.on("sendFriendRequest", async (data) => {
    try {
      const parsed = sendFriendRequestSchema.parse(data);

      const receiverId = await userRepo.getIdByEmail(parsed.receiverEmail);
      if (!receiverId) {
        socket.emit("friendRequestError", { message: "User not found" });
        return;
      }

      io.to(receiverId.id).emit("friendRequestReceived", {
        message: "You have a new friend request",
        senderName: parsed.senderName
      });

    } catch (err) {
      socket.emit("friendRequestError", { message: "Invalid data" });
    }
  });
};

export const onFriendRequestRespond = (io: Server, socket: Socket) => {
  socket.on("friendRequestRespond", (data) => {
    try {
      const parsed = respondFriendRequestSchema.parse(data);

      io.to(parsed.senderId).emit("friendRequestResponded", {
        message: "friend request has been responded",
        responderName: parsed.responderName,
        status: parsed.status
      });

    } catch (err) {
      socket.emit("friendRequestError", { message: "Invalid data" });
    }
  });
};