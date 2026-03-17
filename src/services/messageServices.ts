import AppError from "../utils/AppError";
import * as messageRepo from "../repositories/messageRepos"
import { MessageKey } from "../types/messageKeyType";


export const createMessage = async(chatId: string, content: string, senderId: string,iv:string,keys:MessageKey[]) =>{
  return await messageRepo.createMessage(chatId,content,senderId,iv,keys);
}

export const deleteMessage = async(messageId: string,senderId:string) =>{
  const checkOwner = await messageRepo.checkOwner(messageId,senderId);
  if(!checkOwner){
    throw new AppError("User not authorized to delete message",403)
  }
  return await messageRepo.deleteMessage(messageId);
}

export const updateMessage = async(messageId: string,content: string,senderId:string) =>{
  const checkOwner = await messageRepo.checkOwner(messageId,senderId);
  if(!checkOwner){
    throw new AppError("User not authorized to update message",403)
  }
  return await messageRepo.updateMessage(messageId,content);
}