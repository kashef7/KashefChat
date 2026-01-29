import { Request,Response,NextFunction } from "express";
import * as authServices from "../services/authServices";
import signIn from "../utilils/tokenGenerator";

export const signUp = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const user = await authServices.signUp(req.body);
    signIn(user,res);
    res.status(200).json({
      status: 'success',
      data:{
        user : user
      }
    })
  } catch(err){
    next(err);
  }
}

export const login = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const user = await authServices.logIn(req.body);
    signIn(user,res);
    res.status(200).json({
      status: 'success',
    })
  } catch(err){
    next(err);
  }
}