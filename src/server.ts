import "dotenv/config";
import { app } from "./app";
import { createServer } from "http";
import { Server } from "socket.io";
import {onConnect} from "./sockets/connectionSocket";
import {socketProtect} from "./middleware/authMiddleware";
const Port = Number(process.env.PORT) || 3000;

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors:{
    origin: process.env.IO_CORS_ORIGIN,
    credentials: true
  }
})
io.use(socketProtect);
onConnect(io);

httpServer.listen(Port,async ()=>{
  console.log(`listening on port ${Port}`);
})
