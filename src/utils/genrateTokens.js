import jwt from "jsonwebtoken";
import crypto from "crypto";

// Refresh tokens are stored hashed so a DB read leak can't be replayed.
// SHA-256 is deterministic, so we keep a simple SQL equality match on lookup.
// (bcrypt would be overkill here — the JWT already has high entropy.)
export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const genrateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN },
  );
};

export const genrateRefreshToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN },
  );
};
