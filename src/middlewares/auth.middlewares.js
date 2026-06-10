import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { genrateAccessToken, hashRefreshToken } from "../utils/genrateTokens.js";
import { accessCookieOptions } from "../utils/httpOnly.js";

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

  // 1. Verify signature + expiry first (no DB hit).
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // 2. The stored value is the SHA-256 hash of the token, so hash the cookie
  //    token and match on that. This still lets logout (which nulls the
  //    column) invalidate the session.
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT user_id, email, role
     FROM users
     WHERE user_id = $1 AND refresh_token = $2`,
    [decoded.user_id, hashedRefreshToken]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const user = rows[0];

  res.cookie("accessToken", genrateAccessToken(user), accessCookieOptions);
  req.user = user;

  next();
});
