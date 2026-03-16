import { Request,Response,NextFunction } from "express";
import * as userServices from "../services/userServices";
import AppError from "../utils/AppError";
import * as userValidation from "../validators/userValidators";
import * as googleAuthServices from "../services/googleAuthServices";

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
    const validUserId = userValidation.idSchema.parse(req.user!.id);
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

export const updateGoogleUser = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const validUserId = userValidation.idSchema.parse(req.user!.id);
    const user = await userServices.getUserProfile(validUserId);
    
    if(!user) {
      return next(new AppError("User not found", 404));
    }
    await googleAuthServices.updateGoogleUser(validUserId, {
      publicKey: req.body.publicKey,
      KeyBackup: {
        upsert: {
          create: {
            ciphertext: req.body.KeyBackup.ciphertext,
            salt:       req.body.KeyBackup.salt,
            iv:         req.body.KeyBackup.iv,
          },
          update: {
            ciphertext: req.body.KeyBackup.ciphertext,
            salt:       req.body.KeyBackup.salt,
            iv:         req.body.KeyBackup.iv,
          },
        },
      },
    });
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
