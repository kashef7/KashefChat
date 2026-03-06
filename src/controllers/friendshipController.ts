import { Request,Response,NextFunction } from "express";
import * as friendshipServices from "../services/friendshipServices";
import * as userValidation from "../validators/userValidators";
import * as friendshipValidation from "../validators/friendsValidators";

export const getFriends = async (req:Request,res:Response,next:NextFunction) => {
  try{
    const validId = userValidation.idSchema.parse(req.user!.id);
    const friends = await friendshipServices.getFriends(validId);
    res.status(200).json({
      status: 'success',
      data:{
        friends:friends
      }
    })
  }catch(err){
    next(err);
  }
}


export const getPendingRequests = async (req:Request,res:Response,next:NextFunction) => {
  try{
    const validId = userValidation.idSchema.parse(req.user!.id);
    const requests = await friendshipServices.getPendingRequests(validId);
    res.status(200).json({
      status: 'success',
      data:{
        requests:requests
      }
    })
  }catch(err){
    next(err);
  }
}

export const getPendingRequestsReceived = async (req:Request,res:Response,next:NextFunction) => {
  try{
    const validId = userValidation.idSchema.parse(req.user!.id);
    const requests = await friendshipServices.getPendingRequestsReceived(validId);
    res.status(200).json({
      status: 'success',
      data:{
        requests:requests
      }
    })
  }catch(err){
    next(err);
  }
}

export const sendFriendRequest = async(req:Request,res:Response,next:NextFunction) =>{
  try{
    const validId = userValidation.idSchema.parse(req.user!.id);
    const validEmail = userValidation.emailSchema.parse(req.body.receiverEmail);
    const request = await friendshipServices.sendFriendRequest(validId,validEmail);
    res.status(200).json({
      status: 'success',
      data:{
        request:request
      }
    })
  }catch(err){
    next(err);
  }
}

export const respondToRequest = async(req:Request,res:Response,next:NextFunction) =>{
  try{
    const validReceiverId = userValidation.idSchema.parse(req.user!.id);
    const validSenderId = userValidation.idSchema.parse(req.body.senderId);
    const validRespond =  friendshipValidation.statusSchema.parse(req.body.respond);  ;
    const request = await friendshipServices.respondToRequest(validSenderId,validReceiverId,validRespond);
    res.status(200).json({
      status: 'success',
      data:{
        request:request
      }
    })
  }catch(err){
    next(err);
  }
}

export const removeFriend = async(req:Request,res:Response,next:NextFunction) =>{
  try{
    const validId = userValidation.idSchema.parse(req.user!.id);
    const validFriendId = userValidation.idSchema.parse(req.body.friendId);
    const result = await friendshipServices.removeFriend(validId,validFriendId);
    res.status(200).json({
      status: 'success',
      data:{
        friendship:result
      }
    })
  }catch(err){
    next(err);
  }
}