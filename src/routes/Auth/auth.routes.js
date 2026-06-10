import express from "express";
import { login, register } from "../../controllers/userAuth.js";

import { loginSchema, registerSchema } from "../../validations/auth.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), register);

authRouter.post("/login", validate(loginSchema), login);

export { authRouter };

