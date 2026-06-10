import express from 'express';
import cookieParser from 'cookie-parser';
import {authRouter} from './src/routes/Auth/auth.routes.js';
import { requestLimiter } from "./src/middlewares/requestLimiter.middleware.js";
import { authProtectedRouter } from './src/routes/Auth/protectedAuth.routes.js';

const app= express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", requestLimiter);
app.use("/api", authRouter);
app.use("/api", authProtectedRouter);

export {app};