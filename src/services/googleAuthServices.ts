import { createUser, findByEmail , updateUserbyId } from "../repositories/userRepo";
import type { Profile } from "passport-google-oauth20";


//We need to generate the public and private keys for the google User and encrypt the KeyBackup with a unique and safe Key 

export const googleLogin = async (profile: Profile) => {
  const email = profile.emails?.[0].value;
  const name = profile.displayName;
  if (!email) {
    throw new Error("Google account has no email.");
  }

  let user = await findByEmail(email);
  if(!user){
    user = await createUser({
      name,
      email,
      password: null,
      userType:"Google",
      publicKey:"placeHolder",
      KeyBackup: {
        create: {
          ciphertext: "placeHolder",
          salt:       "placeHolder",
          iv:         "placeHolder",
        },
      },
    });
  }

  return user;
}

export const updateGoogleUser = async (id:string,data:any) => {
  return await updateUserbyId(id, data);
}