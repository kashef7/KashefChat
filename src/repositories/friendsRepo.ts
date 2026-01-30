import {Prisma} from "@prisma/client";
import prisma from "../prismaClient";


export const getFriends = async(id:string) =>{
  return await prisma.friendShip.findMany({
    where:{
      OR:[
        {senderId: id},
        {receiverId: id}
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