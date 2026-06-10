import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { genrateAccessToken } from "../utils/genrateTokens.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;

  
  if (accessToken) {
    try {
      req.user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      return next();
    } catch (error) {
      // Invalid/expired access token — fall through and try to refresh.
    }
  }

  // 2. Access token missing or expired: silently refresh using the cookie.
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "You are not authorized");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // The token must still be the one stored for this user — this is what lets
  // logout (which nulls the column) actually invalidate the session.
  const { rows } = await pool.query(
    `SELECT user_id, email, role
     FROM users
     WHERE user_id = $1 AND refresh_token = $2`,
    [decoded.user_id, refreshToken]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const user = rows[0];

  res.cookie("accessToken", genrateAccessToken(user), { httpOnly: true });
  req.user = user;

  next();
});
