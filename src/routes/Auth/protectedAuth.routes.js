import express from "express";
import {getMe, logOut} from "../../controllers/userAuth.js";

import { verifyJWT } from "../../middlewares/auth.middlewares.js";

const authProtectedRouter = express.Router();

authProtectedRouter.post("/logout", verifyJWT, logOut);
authProtectedRouter.post("/me", verifyJWT, getMe);


export {authProtectedRouter};