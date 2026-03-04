import prisma from "../prismaClient";

export const createMessage = async (
  chatId: string,
  content: string,
  senderId: string
) => {
  return prisma.message.create({
    data: {
      content,
      senderId,
      chatId,
    },
  });
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