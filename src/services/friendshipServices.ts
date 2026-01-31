import AppError from "../utilils/AppError";
import * as friendsRepo from "../repositories/friendsRepo";
import * as userRepo from "../repositories/userRepo";
import { FriendShipStatus } from "@prisma/client";

export const getFriends = async(id:string)=>{
  return await friendsRepo.getFriends(id);
}

export const getPendingRequests = async(id:string)=>{
  return await friendsRepo.getPendingRequests(id);
}

export const getPendingRequestsReceived = async(id:string)=>{
  return await friendsRepo.getPendingRequestsReceived(id);
}

export const sendFriendRequest = async(senderId:string,receiverId:string) =>{
  if(senderId === receiverId){
    throw new AppError("Can't Send Friend request to oneself",400);
  }
  const receiver = await userRepo.findById(receiverId);
  if(!receiver){
    throw new AppError("User does not exist",404);
  }

  const requestStatus = await friendsRepo.getRequestStatus(senderId,receiverId);

  if(requestStatus){
    if(requestStatus?.status == "Pending"){
      throw new AppError("request already sent",400);
    }
    if (requestStatus?.status == "Accepted"){
      throw new AppError("You are already friends with user",400);
    }
    const status = await friendsRepo.updateRequestStatus(senderId,receiverId,"Pending");
    return status;
  }

  return await friendsRepo.createFriendship({
    sender: {
      connect: { id: senderId }
    },
    receiver: {
      connect: { id: receiverId }
    },
    status: "Pending"
  });
}

export const respondToRequest = async (senderId:string,receiverId:string,status:FriendShipStatus) =>{
  return await friendsRepo.updateRequestStatus(senderId,receiverId,status);
}

export const removeFriend = async (userId:string,friendId:string) =>{
  const result = await friendsRepo.removeFriend(userId,friendId);
  
  if(!result){
    throw new AppError("Friendship not found or not accepted",400);
  }
  
  return result;
}

