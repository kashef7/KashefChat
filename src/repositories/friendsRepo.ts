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
    },
    include:{
      sender:{
        select:{
          id: true,
          name: true,
          email: true
        }
      },
      receiver:{
        select:{
          id: true,
          name: true,
          email: true
        }
      }
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
    },
    include:{
      sender:{
        select:{
          name: true,
          email: true
        }
      }
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
      status: status,
      senderId: senderId,
      receiverId: receiverId
    }
  });
}


export const createFriendship = async (data:Prisma.FriendShipCreateInput) =>{
  return await prisma.friendShip.create({data});
}

export const removeFriend = async (senderId:string,receiverId:string) =>{
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

  if (friendship.status !== "Accepted") {
    return null;
  }

  return await prisma.friendShip.delete({
    where:{
      id: friendship.id
    }
  });
}