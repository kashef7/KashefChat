import bcrypt from "bcrypt";
import AppError from "../utils/AppError";
import { Response } from "express";
import { createUser, findByEmail } from "../repositories/userRepo";


export const signUp = async (body:any) =>{

  if (body.password != body.confirmPassword) {
    throw new AppError('Password and confirmPassword do not match', 400);
  }

  const existingUser = await findByEmail(body.email);
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  return await createUser({
    name: body.name,
    email: body.email,
    password: hashedPassword,
  })
}

export const logIn = async (body:any) =>{
  const {email,password} = body;

    if(!email || !password){
      throw new AppError("Please provide both email and password.", 400);
    }

    const user = await findByEmail(email);
    
    if(!user){
      throw new AppError("No account found with that email.", 404);
    }
    const loggedPassword = password;

    const userPassword = user.password || "";

    const isCorrectPassword = await bcrypt.compare(loggedPassword,userPassword);

    if(!isCorrectPassword){
      throw new AppError("Incorrect password. Please try again.", 401);
    }

  return user;
}

export const logOut = (res: Response) => {

  const COOKIE_EXPIRES_IN_DAYS = Number(process.env.JWT_EXPIRES_IN) || 30;

  const cookieOptions = {
    expires: new Date(Date.now() + COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  res.clearCookie("jwt", cookieOptions);
};