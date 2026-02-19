import { Request,Response,NextFunction } from "express";
import * as userServices from "../services/userServices";
import AppError from "../utils/AppError";



export const getAllUsersNameEmail = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const users = await userServices.getAllUsers();
    res.status(200).json({
      status: 'success',
      data:{
        users : users
      }
    })
  } catch(err){
    next(err);
  }
}

export const getMe = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    // req.user is guaranteed to exist due to protect middleware
    const user = await userServices.getUserProfile(req.user.id);
    
    if(!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: 'success',
      data:{
        user: user
      }
    })
  } catch(err){
    next(err);
  }
}


