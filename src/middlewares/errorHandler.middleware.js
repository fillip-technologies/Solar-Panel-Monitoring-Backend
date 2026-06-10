import ApiError from "../utils/ApiError.js";

// Central error handler — must be registered AFTER all routes.
// Turns thrown ApiErrors (and any unexpected errors) into the standard
// JSON response shape instead of Express's default HTML page.
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
