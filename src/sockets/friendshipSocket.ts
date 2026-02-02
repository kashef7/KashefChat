import { Server, Socket } from "socket.io";

export const onFriendRequestSent = (io: Server, socket: Socket) => {
  socket.on("sendFriendRequest", (data: { receiverId: string, senderName: string }) => {
    io.to(data.receiverId).emit("friendRequestReceived", {
      message: "You have a new friend request",
      senderName: data.senderName
    });
  });
}

export const onFriendRequestRespond = (io: Server, socket: Socket) => {
  socket.on("friendRequestRespond", (data: { senderId: string, responderName: string,status:string}) => {
    io.to(data.senderId).emit("friendRequestResponded", {
      message: "friend request has been responded",
      responderName: data.responderName,
      status: data.status
    });
  });
}

