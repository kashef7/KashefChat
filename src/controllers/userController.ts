import { Request,Response,NextFunction } from "express";
import * as userServices from "../services/userServices";
import AppError from "../utils/AppError";
import * as userValidation from "../validators/userValidators";


export const getAllUsersNameEmail = async (_req:Request,res:Response,next:NextFunction) =>{
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
    const validUserId = userValidation.idSchema.parse(req.user.id);
    const user = await userServices.getUserProfile(validUserId);
    
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


