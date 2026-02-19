import AppError from "../utils/AppError";
import { Request,Response,NextFunction } from "express";

export function errorHandler(err:Error,req:Request,res:Response,next:NextFunction){
  
  if(err instanceof AppError){
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message:err.message,
      }
    })
  }

  console.error("Unhandled Error",err);
  return res.status(500).json({
      success: false,
      error: {
        message:"Unhandled Internal Error",
        code:"Internal Code Error"
      }
    })

}