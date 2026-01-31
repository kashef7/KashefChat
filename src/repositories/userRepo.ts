import {Prisma} from "@prisma/client";
import prisma from "../prismaClient";


export const createUser = async(data:Prisma.UserCreateInput) =>{
  return await prisma.user.create({
    data,
  });
}

export const findByEmail = async(email:string) =>{
  return await prisma.user.findUnique({
    where: {email},
  });
}

export const findById = async(id:string) =>{
  return await prisma.user.findUnique({
    where:{id}
  })
}

export const findAll = async() =>{
  return await prisma.user.findMany();
}

export const findAllNameEmail = async() =>{
  return await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      id: true
    }
  });
}