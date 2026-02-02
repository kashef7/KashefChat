import prisma from "../prismaClient";

export const findChatBetweenUsersOptimized = async (user1Id: string, user2Id: string) => {
  const chat = await prisma.chat.findFirst({
    where: {
      type: 'private',
      AND: [
        { members: { some: { userId: user1Id } } },
        { members: { some: { userId: user2Id } } }
      ],
      // Ensure it's exactly these two users (no extra members)
      members: { every: { userId: { in: [user1Id, user2Id] } } }
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
  return await prisma.chat.create({
    data: {
      type: 'private',
      members: {
        create: [
          { userId: user1Id },
          { userId: user2Id }
        ]
      }
    },
    include: {
      members: true
    }
  });
}

export const findChatById = async (chatId: string) => {
  return await prisma.chat.findUnique({
    where: { id: chatId },
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