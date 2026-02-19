import AppError from "../utils/AppError";
import * as chatRepo from "../repositories/chatRepo";

export const startChat = async(user1Id: string, user2Id: string) => {
  if(!user1Id || !user2Id) {
    throw new AppError("User Id missing", 400);
  }
  
  if(user1Id === user2Id) {
    throw new AppError("Cannot start chat with yourself", 400);
  }

  // Try to find existing chat
  let chat = await chatRepo.findChatBetweenUsersOptimized(user1Id, user2Id);

  // If no chat exists, create one
  if (!chat) {
    const newChat = await chatRepo.createChat(user1Id, user2Id);
    return newChat;
  }

  return chat;
}

export const getChatById = async (chatId: string, userId: string) => {
  const chat = await chatRepo.findChatById(chatId);
  
  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  // Verify user is a member of this chat
  const isMember = chat.members.some(member => member.userId === userId);
  if (!isMember) {
    throw new AppError("You are not a member of this chat", 403);
  }

  return chat;
}