import AppError from "../utilils/AppError";
import * as friendsRepo from "../repositories/friendsRepo";
/*
  users can check their friends list -> get all users from friend ship where user == sender  || user == receiver
  users can check if any pending friend requests -> get all friend requests if user == sender and status = pending
  users can send friend requests
  users can accept or reject friend requests
*/

export const getFriends = async(id:string)=>{
  return await friendsRepo.getFriends(id);
}

export const getPendingRequests = async(id:string)=>{
  return await friendsRepo.getPendingRequests(id);
}