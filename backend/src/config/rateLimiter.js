import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/apiError.js";

// Configure rate limiter middleware to prevent misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Time window is 15 minutes
  max: 2, // Max requests per 15 minutes for each IP address
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers response
  legacyHeaders: false, // Disable legacy headers or `X-RateLimit-*` headers

  // Custom function to generate a unique identifier for rate limiting (using client's IP address)
  keyGenerator: (req, res) => {
    return req.clientIp;
  },

  // Custom handler function executed when rate limit is exceeded
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${options.max} requests per ${options.windowMs / 60000} minutes`
    );
  },
});

export { limiter };
