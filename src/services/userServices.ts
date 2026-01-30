import * as userRepo from "../repositories/userRepo";


export const getAllUsers = async () =>{
  return await userRepo.findAllNameEmail();
}