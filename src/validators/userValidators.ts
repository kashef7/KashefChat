import {z} from "zod";


export const createUserSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(40, { message: "Name must be at most 40 characters" }),
  email: z.string()
    .email({ message: "Invalid email address" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be at most 100 characters" }),
  confirmPassword: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be at most 100 characters" })
});

export const emailSchema = z.string().email({ message: "Invalid email address" });

export const idSchema = z.string().uuid("Invalid id format");

export const updateUserSchema = createUserSchema.partial();

export const loginSchema = createUserSchema.pick({
  email: true,
  password: true,
});