import ApiError from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";


const verifyJWT = asyncHandler(async (req , res , next) => {
    const token = req?.cookies.accessToken;

    if(!token) throw new ApiError(401, "You are not authorized");
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user=decoded;
    next();
})