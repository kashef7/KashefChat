import prisma from "../prismaClient";
import * as userValidation from "../validators/userValidators";

export const findChatBetweenUsersOptimized = async (user1Id: string, user2Id: string) => {
  const validUser1Id = userValidation.idSchema.parse(user1Id);
  const validUser2Id = userValidation.idSchema.parse(user2Id);
  const chat = await prisma.chat.findFirst({
    where: {
      type: 'private',
      AND: [
        { members: { some: { userId: validUser1Id } } },
        { members: { some: { userId: validUser2Id } } }
      ],
      // Ensure it's exactly these two users (no extra members)
      members: { every: { userId: { in: [validUser1Id, validUser2Id] } } }
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      messages: {
        orderBy: { sentAt: 'desc' },
      }
    }
  });

  return chat;
}

// Create a new chat
export const createChat = async (user1Id: string, user2Id: string) => {
  const validUser1Id = userValidation.idSchema.parse(user1Id);
  const validUser2Id = userValidation.idSchema.parse(user2Id);
  return await prisma.chat.create({
    data: {
      type: 'private',
      members: {
        create: [
          { userId: validUser1Id },
          { userId: validUser2Id }
        ]
      }
    },
    include: {
      members: true
    }
  });
}

export const findChatById = async (chatId: string) => {
  const validChatId = userValidation.idSchema.parse(chatId);
  return await prisma.chat.findUnique({
    where: { id: validChatId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 100 // Limit to last 100 messages
      }
    }
  });
}