import { Request,Response,NextFunction } from "express";
import * as authServices from "../services/authServices";
import signIn from "../utils/tokenGenerator";
import * as userValidation from "../validators/userValidators";
export const signUp = async (req:Request,res:Response,next:NextFunction) =>{
  try{
    const validSignUpBody = userValidation.createUserSchema.parse(req.body);
    const user = await authServices.signUp(validSignUpBody);
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
    const validLoginBody = userValidation.loginSchema.parse(req.body);
    const user = await authServices.logIn(validLoginBody);
    signIn(user,res);
    res.status(200).json({
      status: 'success',
    })
  } catch(err){
    next(err);
  }
}

export const logOut = async (_req:Request,res:Response,next:NextFunction) =>{
  try{
    authServices.logOut(res);
    res.status(200).json({
      status: 'success',
    })
  } catch(err){
    next(err);
  }
}