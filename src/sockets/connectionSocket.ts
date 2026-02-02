import { Server } from "socket.io";
import * as friendSocket from "./friendshipSocket";
import * as chatSocket from "./chatSocket";

export const onConnect = (io:Server) =>{
  io.on("connection",(socket)=>{
  console.log(`Connection to socket.io successful:${socket.id}`);
  
  socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

  friendSocket.onFriendRequestSent(io, socket);
  friendSocket.onFriendRequestRespond(io, socket);
  chatSocket.onChatJoin(io, socket);
  chatSocket.onSendMessage(io, socket);
})
}

