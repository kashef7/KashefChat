import prisma from "../prismaClient";


export const createMessage = async (chatId: string, content: string, senderId: string) =>{
  return await prisma.message.create({
        data: {
          content: content,
          senderId: senderId,
          chatId: chatId
        }
      });
}

export const deleteMessage = async (messageId: string) =>{
  await prisma.message.delete({
        where:{
          id:messageId
        }});
}

export const updateMessage = async (messageId: string,content: string) =>{
  return await prisma.message.update({
    where:{
      id:messageId
    },data: {
          content:content
    }
  })
}

export const checkOwner = async (messageId:string,senderId:string)=>{
  const result = await prisma.message.findFirst({
    where:{
      AND:[
        {senderId:senderId},
        {id:messageId}
      ]
    }
  })
  if(result){
    return true;
  }
  return false;
}