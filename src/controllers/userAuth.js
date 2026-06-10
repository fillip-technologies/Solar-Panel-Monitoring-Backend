import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import {
  genrateAccessToken,
  genrateRefreshToken,
} from "../utils/genrateTokens.js";

export const register = asyncHandler(async (req, res) => {
  const { username, email, mobile_number, password_hash, role } = req.body;

  const existingUser = await pool.query(
    "SELECT email FROM users WHERE email = $1",
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password_hash, 10);

  const user = await pool.query(
    `INSERT INTO users
    (username, email, mobile_number, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING user_id, username, email, mobile_number, role`,
    [username, email, mobile_number, hashedPassword, role],
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
  const { email, password_hash } = req.body;

  const result = await pool.query(
    `SELECT user_id, username, email,mobile_number, password_hash, role
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, "User not found");
  }

  const user = result.rows[0];

  const isPasswordCorrect = await bcrypt.compare(
    password_hash,
    user.password_hash
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  const accessToken = genrateAccessToken(user);
  const refreshToken = genrateRefreshToken(user);

  await pool.query(
    `UPDATE users
     SET refresh_token = $1
     WHERE user_id = $2`,
    [refreshToken, user.user_id]
  );
  delete user?.password_hash;
  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
    })
    .json(
      new ApiResponse(
        200,
        user,
        `Welcome ${user.username}`
      )
    );
});

export const logOut = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE users
     SET refresh_token = NULL
     WHERE user_id = $1`,
    [req.user.user_id]
  );

  return res
    .status(200)
    .clearCookie("accessToken", { httpOnly: true })
    .clearCookie("refreshToken", { httpOnly: true })
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await pool.query(
    `SELECT user_id, username, email,mobile_number, role
     FROM users
     WHERE user_id = $1`,
    [req.user.user_id]
  );
  
  res.status(200).json({user: user.rows[0]})
})