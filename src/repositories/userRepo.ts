import prisma from "../prismaClient";

export const createUser = async(data:any) =>{
  return await prisma.user.create({
    data,
  });
}

export const findByEmail = async(email:string) =>{
  return await prisma.user.findUnique({
    where: {email:email},
  });
}

export const getIdByEmail = async(email:string) =>{
  return await prisma.user.findUnique({
    where: {email:email},
    select:{
      id:true
    }
  });
}
export const findById = async(id:string) =>{
  return await prisma.user.findUnique({
    where:{id:id}
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
    where:{id:id},
    select: {
      name: true,
      email: true,
      id: true
    }
  });
}