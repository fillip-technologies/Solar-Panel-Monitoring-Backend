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

export const login = asyncHandler(async (req,res) => {
  const { email, password_hash } = req.body;
  const user = await pool.query("SELECT user_id username email mobile_number password_hash role  FROM users where email=$1", [
    email,
  ]);

  if (user.rows.length < 0)
    throw new ApiError(401, "Ohh-ho! You are not connected with us yet");

  if (user.password_hash != password_hash)
    throw new ApiError(402, "Please enter correct password");

  const accesToken = genrateAccessToken(user);
  const refreshToken = genrateRefreshToken(user);

  user.refreshToken = refreshToken;

  res
    .status(200)
    .cookies(accesToken)
    .cookies(refreshToken)
    .json(
      ApiResponse(
        200,
        `Welcome to the green and clean community ${user.username}`,
      ),
    );
});
