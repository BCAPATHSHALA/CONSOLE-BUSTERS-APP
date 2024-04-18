import { ApiError } from "../utils/apiError.js";
const ErrorMiddleware = (err, req, res, next) => {
  // Set default status code and message for the error
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // UNAUTHORIZED ACCESS ERROR 1: Handle error for unauthorized access
  if (err.name === "UnauthorizedError") {
    const message = `UnauthorizedError: Please login to continue`;
    err = new ApiError(401, message);
  }

  // MONGOOSE VALIDATION ERROR 1: Handle error for invalid request parameters
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    err = new ApiError(400, message[0]);
  }

  // MONGODB ERROR 1: Handle error for wrong MongoDB ID
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ApiError(400, message);
  }

  // MONGODB ERROR 2: Handle error for duplicate entries in MongoDB
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ApiError(400, message);
  }

  // JWT ERROR 1: Handle error for invalid JSON Web Token
  if (err.name === "jsonWebTokenError") {
    const message = `JSON Web Token is invalid. Please try again`;
    err = new ApiError(400, message);
  }

  // JWT ERROR 2: Handle error for expired JSON Web Token
  if (err.name === "TokenExpiredError") {
    const message = `JSON Web Token has expired. Please try again`;
    err = new ApiError(400, message);
  }

  // MULTER ERROR 1: File too large
  if (err.name === "MulterError") {
    const message = `Video size should be at most 10 MB`;
    if (err.message === "File too large") {
      err = new ApiError(400, message);
    }
  }

  // Send response with appropriate status code and error message
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export { ErrorMiddleware };
