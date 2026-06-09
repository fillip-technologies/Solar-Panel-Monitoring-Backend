import express from 'express'
import { register } from '../controllers/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);

export {authRouter}