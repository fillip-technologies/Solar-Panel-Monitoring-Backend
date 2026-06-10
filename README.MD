# Solar Panel Monitoring

A Node.js + Express backend for monitoring and managing solar panel systems. The current release ships the **authentication layer** (user registration & login with JWT), built on top of PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
  - [Register](#1-register-a-user)
  - [Login](#2-login)
- [Response Format](#response-format)
- [Rate Limiting](#rate-limiting)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- 🔐 **User authentication** — registration & login with hashed passwords (bcrypt)
- 🎫 **JWT tokens** — access & refresh tokens issued on login, set as `httpOnly` cookies
- ✅ **Request validation** — schema validation with Zod on every input
- 🚦 **Rate limiting** — protects endpoints from abuse
- 🗄️ **PostgreSQL** — connection pooling via `pg`
- 📦 **Consistent API responses** — unified success/error response shape

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Runtime          | Node.js (ES Modules)                |
| Framework        | Express 5                           |
| Database         | PostgreSQL (`pg`)                   |
| Auth             | `jsonwebtoken`, `bcrypt`            |
| Validation       | `zod`                               |
| Rate limiting    | `express-rate-limit`               |
| Config           | `dotenv`                            |

---

## Prerequisites

Make sure the following are installed:

- **Node.js** v18 or higher (the `--watch` dev script requires v18+)
- **npm** v9 or higher
- **PostgreSQL** v12 or higher

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fillip-technologies/Solar-Panel-Monitoring-Backend
   cd Solar-Panel-Monitoring-Backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your `.env` file** (see [Environment Variables](#environment-variables) below).

4. **Run the database migration** to create the `users` table:
   ```bash
   npm run migrate
   ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=4000

# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/solar_panel_db

# JWT — access token
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m

# JWT — refresh token
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
```

| Variable                  | Description                                          | Example         |
| ------------------------- | ---------------------------------------------------- | --------------- |
| `PORT`                    | Port the server listens on (defaults to `4000`)      | `4000`          |
| `DATABASE_URL`            | PostgreSQL connection string                         | `postgresql://...` |
| `ACCESS_TOKEN_SECRET`     | Secret used to sign access tokens                    | random string   |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime                                | `15m`           |
| `REFRESH_TOKEN_SECRET`    | Secret used to sign refresh tokens                   | random string   |
| `REFRESH_TOKEN_EXPIRES_IN`| Refresh token lifetime                               | `7d`            |

> ⚠️ Never commit your `.env` file. Use long, random values for the token secrets.

---

## Running the Application

| Command            | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `npm start`        | Starts the server (`node server.js`)                    |
| `npm run dev`      | Starts the server with auto-reload on file changes      |
| `npm run migrate`  | Creates the `users` table in the database               |

```bash
npm start
```

On startup the server:
1. Loads environment variables from `.env`
2. Initializes the Express app
3. Connects to PostgreSQL and runs a test query
4. Listens on `PORT`

You should see `connected` in the console once the database is reachable.

The API base URL is:

```
http://localhost:<PORT>/api
```

---

## Project Structure

```
Solar-Panel-Monitoring/
├── src/
│   ├── config/
│   │   └── db.js                       # PostgreSQL connection pool
│   ├── controllers/
│   │   └── userAuth.js                 # register & login request handlers
│   ├── middlewares/
│   │   ├── auth.middlewares.js         # # (reserved) JWT verification
│   │   ├── requestLimiter.middleware.js# global rate limiter
│   │   ├── validate.middleware.js      # Zod schema validation
│   │                  
│   ├── migrations/
│   │   └── user.js                     # creates the users table
│   ├── routes/
│   │   └── auth.routes.js              # /api/register, /api/login routes
│   ├── utils/
│   │   ├── ApiError.js                 # standardized error class
│   │   ├── ApiResponse.js              # standardized success response class
│   │   ├── asyncHandler.js             # async error-handling wrapper
│   │   └── genrateTokens.js            # access & refresh token generators
│   └── validations/
│       └── auth.validation.js          # Zod schemas for register & login
├── app.js                              # Express app setup & middleware wiring
├── server.js                           # Entry point — starts the server
├── package.json
└── README.MD
```

---

## API Documentation

**Base URL:** `http://localhost:<PORT>/api`

All request and response bodies are JSON. Send `Content-Type: application/json`.

> **Note on `password_hash`:** the request field is named `password_hash`, but you should send the **plain-text password** — the server hashes it before storing.

---

### 1. Register a User

Creates a new user account.

```
POST /api/register
```

**Request body:**

| Field           | Type   | Required | Rules                                      |
| --------------- | ------ | -------- | ------------------------------------------ |
| `username`      | string | ✅       | Minimum 3 characters                       |
| `email`         | string | ✅       | Valid email address (must be unique)       |
| `mobile_number` | string | ✅       | Exactly 10 digits                          |
| `password_hash` | string | ✅       | Minimum 8 characters (sent as plain text)  |
| `role`          | string | ❌       | `"user"` or `"admin"` (defaults to `user`) |

**Example request:**

```json
{
  "username": "govind",
  "email": "govind@example.com",
  "mobile_number": "9876543210",
  "password_hash": "SuperSecret123",
  "role": "user"
}
```

**Success — `201 Created`:**

```json
{
  "statusCode": 201,
  "data": {
    "user_id": "a1b2c3d4-...",
    "username": "govind",
    "email": "govind@example.com",
    "mobile_number": "9876543210",
    "role": "user"
  },
  "message": "Welcome to clean and green community",
  "success": true
}
```

**Error responses:**

| Status | Reason                          |
| ------ | ------------------------------- |
| `400`  | Validation failed (see body)    |
| `409`  | A user with that email exists   |

---

### 2. Login

Authenticates a user and issues JWT tokens.

```
POST /api/login
```

**Request body:**

| Field           | Type   | Required | Rules                                     |
| --------------- | ------ | -------- | ----------------------------------------- |
| `email`         | string | ✅       | Valid email address                       |
| `password_hash` | string | ✅       | Minimum 8 characters (sent as plain text) |

**Example request:**

```json
{
  "email": "govind@example.com",
  "password_hash": "SuperSecret123"
}
```

**Success — `200 OK`:**

On success the server sets two `httpOnly` cookies — `accessToken` and `refreshToken` — and returns the user:

```json
{
  "statusCode": 200,
  "data": {
    "user_id": "a1b2c3d4-...",
    "username": "govind",
    "email": "govind@example.com",
    "mobile_number": "9876543210",
    "role": "user"
  },
  "message": "Welcome govind",
  "success": true
}
```

**Error responses:**

| Status | Reason                                |
| ------ | ------------------------------------- |
| `400`  | Validation failed (see body)          |
| `401`  | User not found / invalid password     |

---

## Response Format

**Successful** responses follow a consistent shape:

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Success",
  "success": true
}
```

**Validation errors** (`400`) return the Zod issues array:

```json
{
  "success": false,
  "errors": [
    {
      "code": "too_small",
      "minimum": 3,
      "path": ["username"],
      "message": "Username must be at least 3 characters"
    }
  ]
}
```

---

## Rate Limiting

A global rate limiter is applied to all routes:

- **Window:** 30 seconds
- **Limit:** 5 requests per window per IP

Exceeding the limit returns:

```json
{
  "success": false,
  "message": "Too many requests. Take a breath and try again."
}
```

---

## Database Schema

The `users` table (created by `npm run migrate`):

| Column          | Type           | Notes                                          |
| --------------- | -------------- | ---------------------------------------------- |
| `user_id`       | UUID           | Primary key, auto-generated                    |
| `username`      | VARCHAR(100)   | Required                                       |
| `email`         | VARCHAR(255)   | Required, unique                               |
| `mobile_number` | VARCHAR(12)    |                                                |
| `password_hash` | TEXT           | bcrypt hash                                    |
| `role`          | VARCHAR(20)    | `user` or `admin`, defaults to `user`          |
| `refresh_token` | TEXT           | Latest refresh token                           |
| `is_verified`   | BOOLEAN        | Defaults to `false`                            |
| `created_at`    | TIMESTAMP      | Defaults to current time                       |
| `updated_at`    | TIMESTAMP      | Defaults to current time                       |

---

## Troubleshooting

**Database connection issues**
- Ensure PostgreSQL is running and reachable.
- Verify `DATABASE_URL` in your `.env`.
- Confirm the database user has the right permissions.

**`relation "users" does not exist`**
- Run the migration: `npm run migrate`.

**Port already in use**
- Change `PORT` in `.env`, or stop the process using that port.

**Module not found errors**
- Run `npm install`. If it persists, delete `node_modules` and reinstall.

---

## License

This project is licensed under the **ISC License** — see [`package.json`](./package.json) for details.

## Repository

[GitHub repository](https://github.com/fillip-technologies/Solar-Panel-Monitoring-Backend) · [Report an issue](hhttps://github.com/fillip-technologies/Solar-Panel-Monitoring-Backend/issues)
</content>
</invoke>
