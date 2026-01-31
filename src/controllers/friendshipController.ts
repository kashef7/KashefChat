import { Request,Response,NextFunction } from "express";
import * as friendshipServices from "../services/friendshipServices";
import { FriendShipStatus } from "@prisma/client";


export const getFriends = async (req:Request,res:Response,next:NextFunction) => {
  try{
    const id = req.user.id;
    const friends = await friendshipServices.getFriends(id);
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
    const id = req.user.id;
    const requests = await friendshipServices.getPendingRequests(id);
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
    const id = req.user.id;
    const requests = await friendshipServices.getPendingRequestsReceived(id);
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
    const id = req.user.id;
    const request = await friendshipServices.sendFriendRequest(id,req.body.receiverId);
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
    const id = req.user.id;
    const respond = req.body.respond as FriendShipStatus;
    const request = await friendshipServices.respondToRequest(req.body.senderId,id,respond);
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