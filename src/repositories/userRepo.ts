import {Prisma} from "@prisma/client";
import prisma from "../prismaClient";
import * as userValidation from "../validators/userValidators"

export const createUser = async(data:Prisma.UserCreateInput) =>{
  const userData = userValidation.createUserSchema.parse(data);
  return await prisma.user.create({
    data:userData,
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

export const findNameEmailById = async(id:string) =>{

  return await prisma.user.findUnique({
    where:{id},
    select: {
      name: true,
      email: true,
      id: true
    }
  });
}