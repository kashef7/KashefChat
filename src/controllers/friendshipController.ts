import { Request,Response,NextFunction } from "express";
import * as friendshipServices from "../services/friendshipServices";


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
