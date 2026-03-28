import prisma from "../prismaClient";
import * as userValidation from "../validators/userValidators";
import { CursorPaginationQuery} from "../types/paginationType";
import { encrypt,decrypt } from "../utils/paginationUtils";

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
      members: { every: { userId: { in: [validUser1Id, validUser2Id] } } }
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, publicKey: true }
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
export const findChatById = async (
  chatId: string,
  userId: string,
  pagination: CursorPaginationQuery 
) => {
  const validChatId = userValidation.idSchema.parse(chatId);
  const take = Math.min(pagination.limit ?? 20, 100);
  const cursor = pagination.cursor ? decrypt(pagination.cursor) : undefined;

  const chat = await prisma.chat.findUnique({
    where: { id: validChatId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, name: true, email: true, publicKey: true,
              keys: {
                where: { userId },
                select: { 
                  encryptedKey: true ,
                  userId: true
                },
                take: 1,
              }
            }
          }
        }
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: take + 1,  
        skip: cursor ? 1 : 0, 
        ...(cursor && { cursor: { id: cursor } }), 
        include: {
        keys: {
          where: { userId },
          select: { encryptedKey: true, userId: true }
        }
      }
      }
    }
  });

  if (!chat) return null;
  const rawMessages = chat.messages;
  const hasNextPage = rawMessages.length > take;
  const messages = hasNextPage ? rawMessages.slice(0, take) : rawMessages;

  return {
    ...chat,
    messages,
    pagination: {
      nextCursor: hasNextPage ? encrypt(messages[messages.length - 1].id) : null,
      prevCursor: pagination.cursor ?? null,
      hasNextPage,
      hasPrevPage: !!pagination.cursor,
    }
  };
};