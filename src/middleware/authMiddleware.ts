import { Response,Request,NextFunction } from "express";
import jwt,{JwtPayload} from "jsonwebtoken";
import AppError from "../utils/AppError";
import * as authRepo from "../repositories/userRepo";
import cookie from "cookie";
import { Socket } from "socket.io";


export const protect = async (req:Request,_res:Response,next:NextFunction) =>{
  try{

    if(!req.cookies.jwt){
      return next(new AppError("User is not logged in",403));
    }

    const token:string = req.cookies.jwt;

    const secret:string = process.env.JWT_SECRET as string;
    
    const decoded = jwt.verify(token,secret);

    if(!decoded){
      return next(new AppError("Invalid JWT token",400));
    }

    const user = await authRepo.findById((decoded as JwtPayload).id);

    if(!user){
      return next(new AppError("User doesn't exist",400));
    }

    req.user = user;

    next();

  } catch(err){
    next(err);
  }
}

export const socketProtect = async (socket:Socket,next:(err?: Error) => void) => {
  try{
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;

    if(!token){
      return next(new Error("User is not logged in"));
    }

    const secret:string = process.env.JWT_SECRET as string;
    
    const decoded = jwt.verify(token,secret);

    if(!decoded){
      return next(new Error("Invalid JWT token"));
    }

    const user = await authRepo.findById((decoded as JwtPayload).id);
    if(!user){
      return next(new Error("User doesn't exist"));
    }
    
    socket.data.user = user;
    next();

  }catch(err){
    next(err instanceof Error ? err : new Error(String(err)));
  }
}