import {z} from "zod";


export const statusSchema = z.enum(["Pending", "Accepted", "Rejected"])

export const friendshipSchema = z.object({
  sender: z.object({
    connect: z.object({
      id: z.string().uuid("Invalid sender id"),
    }),
  }),
  receiver: z.object({
    connect: z.object({
      id: z.string().uuid("Invalid receiver id"),
    }),
  }),
  status: statusSchema.optional(), 
});