import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import {
  genrateAccessToken,
  genrateRefreshToken,
  hashRefreshToken,
} from "../utils/genrateTokens.js";
import { accessCookieOptions, refreshCookieOptions } from "../utils/httpOnly.js";

// Computed once at startup. Used to run a bcrypt.compare even when no user is
// found, so login response timing doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-placeholder", 10);

export const register = asyncHandler(async (req, res) => {
  const { username, email, mobile_number, password } = req.body;

  const existingUser = await pool.query(
    "SELECT email FROM users WHERE email = $1 OR mobile_number = $2",
    [email, mobile_number],
  );
  
  if (existingUser.rows.length > 0) {
    throw new ApiError(409, "Invalid credentials");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const mobile = mobile_number.replace(/\D/g, "").slice(-10);

  const user = await pool.query(
    `INSERT INTO users
    (username, email, mobile_number, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id, username, email, mobile_number, role`,
    [username, email, mobile, hashedPassword],
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        user.rows[0],
        "Welcome to clean and green community",
      ),
    );
});

export const login = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const normalizedUserId = userId.includes("@")
    ? userId.trim().toLowerCase()
    : userId.replace(/\D/g, "").slice(-10);

  const result = await pool.query(
    `SELECT user_id, username, email,mobile_number, password_hash, role
     FROM users
     WHERE email = $1 or mobile_number=$1`,
    [normalizedUserId],
  );

  const user = result.rows[0];

  // Always run bcrypt.compare — against a dummy hash when the user doesn't
  // exist — so the response takes the same time either way and can't be used
  // to enumerate accounts.
  const hashToCompare = user ? user.password_hash : DUMMY_HASH;

  const isPasswordCorrect = await bcrypt.compare(password, hashToCompare);

  if (!user || !isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = genrateAccessToken(user);
  const refreshToken = genrateRefreshToken(user);

  // Store only the hash; the raw token goes to the client in the cookie.
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  await pool.query(
    `UPDATE users
     SET refresh_token = $1
     WHERE user_id = $2`,
    [hashedRefreshToken, user.user_id],
  );
  delete user?.password_hash;
  return res
    .status(200)
    .cookie("accessToken", accessToken,  accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new ApiResponse(200, user, `Welcome ${user.username}`));
});

export const logOut = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE users
     SET refresh_token = NULL
     WHERE user_id = $1`,
    [req.user.user_id],
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await pool.query(
    `SELECT user_id, username, email,mobile_number, role
     FROM users
     WHERE user_id = $1`,
    [req.user.user_id],
  );

  res.status(200).json({ user: user.rows[0] });
});
