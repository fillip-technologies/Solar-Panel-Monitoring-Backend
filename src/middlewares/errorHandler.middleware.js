import ApiError from "../utils/ApiError.js";


export const errorHandler = (err, req, res, next) => {
  const isKnown = err instanceof ApiError;

  const statusCode = isKnown ? err.statusCode : 500;
  const message = isKnown ? err.message : "Internal Server Error";

  // Log unexpected errors only; known ApiErrors are normal control flow.
  if (!isKnown) {
    console.error(err);

  }

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors: err.errors || [],
  });
};
