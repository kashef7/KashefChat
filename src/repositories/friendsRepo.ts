import { FriendShipStatus } from "@prisma/client";
import prisma from "../prismaClient";
import {Prisma} from "@prisma/client";


export const getFriends = async(id:string) =>{
  return await prisma.friendShip.findMany({
    where:{
      OR:[
        {senderId: id,status: "Accepted"},
        {receiverId: id,status: "Accepted"}
      ]
    }
  })
}

export const getPendingRequests = async(id:string) =>{
  return await prisma.friendShip.findMany({
    where:{
      AND:[
        {senderId: id},
        {status: "Pending"}
      ]
    }
  })
}

export const getPendingRequestsReceived = async(id:string) =>{
  return await prisma.friendShip.findMany({
    where:{
      AND:[
        {receiverId: id},
        {status: "Pending"}
      ]
    }
  })
}

export const getRequestStatus = async(senderId:string,receiverId:string) =>{
  return await prisma.friendShip.findFirst({
    where:{
      OR:[
        {senderId:senderId,receiverId:receiverId},
        {senderId:receiverId,receiverId:senderId}
      ]
    },
    select:{
      status:true
    }
  })
}

export const updateRequestStatus = async(senderId:string,receiverId:string,status:FriendShipStatus) =>{
  const friendship = await prisma.friendShip.findFirst({
    where:{
      OR:[
        {senderId:senderId,receiverId:receiverId},
        {senderId:receiverId,receiverId:senderId}
      ]
    }
  });

  if (!friendship) {
    return null;
  }
  return await prisma.friendShip.update({
    where:{
      id: friendship.id
    },
    data:{
      status: status
    }
  });
}


export const createFriendship = async (data:Prisma.FriendShipCreateInput) =>{
  return await prisma.friendShip.create({data});
}

