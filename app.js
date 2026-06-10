import express from 'express';
import cookieParser from 'cookie-parser';
import {authRouter} from './src/routes/Auth/auth.routes.js';
import { requestLimiter } from "./src/middlewares/requestLimiter.middleware.js";
import { authProtectedRouter } from './src/routes/Auth/protectedAuth.routes.js';
import { errorHandler } from "./src/middlewares/errorHandler.middleware.js";

const app= express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", requestLimiter);
app.use("/api", authRouter);
app.use("/api", authProtectedRouter);

// Must be last — catches errors forwarded by asyncHandler.
app.use(errorHandler);

export {app};