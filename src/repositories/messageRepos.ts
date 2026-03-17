import prisma from "../prismaClient";
import { MessageKey } from "../types/messageKeyType";

export const createMessage = async (
  chatId: string,
  content: string,
  senderId: string,
  iv:string,
  keys:MessageKey[]
) => {
  return prisma.$transaction(async (tx) =>{
      const message = await tx.message.create({
        data:{
          content,
          iv,
          senderId,
          chatId
        }
      })
      await tx.messageKey.createMany({
      data: keys.map(({ userId, encryptedKey }) => ({
      messageId: message.id,
      userId,
      encryptedKey,
    })),
  });
  return message;
  })
};

export const deleteMessage = async (messageId: string) => {
  return prisma.message.delete({
    where: {
      id: messageId,
    },
  });
};

export const updateMessage = async (
  messageId: string,
  content: string
) => {
  return prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      content,
    },
  });
};

export const checkOwner = async (
  messageId: string,
  senderId: string
): Promise<boolean> => {
  const result = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: senderId,
    },
    select: {
      id: true,
    },
  });

  return !!result;
};