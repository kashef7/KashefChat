import { Response,Request,NextFunction } from "express";
import jwt,{JwtPayload} from "jsonwebtoken";
import AppError from "../utilils/AppError";
import * as authRepo from "../repositories/userRepo";


export const protect = async (req:Request,res:Response,next:NextFunction) =>{
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

    (req as any).user = user;

    next();

  } catch(err){
    next(err);
  }
}