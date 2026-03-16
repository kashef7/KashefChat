import * as userRepo from "../repositories/userRepo";


export const getAllUsers = async () =>{
  return await userRepo.findAllNameEmail();
}

export const getUserProfile = async (id: string) =>{
  return await userRepo.findNameEmailById(id);
}

export const updateGoogleUser = async (id: string, data: { publicKey?: string; KeyBackup?: string }) =>{
  return await userRepo.updateUserbyId(id, data);
}