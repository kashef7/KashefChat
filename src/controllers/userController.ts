import { Request,Response,NextFunction } from "express";
import * as userServices from "../services/userServices";



export const getAllUsersNameEmail = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const users = await userServices.getAllUsers();
    res.status(200).json({
      status: 'success',
      data:{
        users : users
      }
    })
  } catch(err){
    next(err);
  }
}