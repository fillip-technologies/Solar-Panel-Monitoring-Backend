import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters"),

  email: z
    .email("Invalid email"),

  mobile_number: z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),

  password_hash: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "Email or mobile number is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});