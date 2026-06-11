import rateLimit from "express-rate-limit";

export const requestLimiter = rateLimit({
  windowMs: 1 * 30 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many requests. Take a breath and try again.",
  },
});
