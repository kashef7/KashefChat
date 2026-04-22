import { Request,Response,NextFunction } from "express";
import { User } from "@prisma/client";
import * as authServices from "../services/authServices";
import signIn from "../utils/tokenGenerator";
import * as userValidation from "../validators/userValidators";
import AppError from "../utils/AppError";
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

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    signIn(user, res);

    if(!process.env.GOOGLE_REDIRECT_URL){
      return new AppError("Google redirect url not defined",500);
    }

    if (req.accepts("html")) {
      return res.redirect(process.env.GOOGLE_REDIRECT_URL);
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const googleFailure = (_req: Request, res: Response) => {
  res.status(401).json({
    status: "fail",
    message: "Google authentication failed",
  });
};