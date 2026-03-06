import { createUser, findByEmail } from "../repositories/userRepo";
import type { Profile } from "passport-google-oauth20";


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
    });
  }

  return user;
}