import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Step 1: access token from cookies or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Step 2: check token does exist or not in cookies or header
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Step 3: validate the token is valid or not if valid then decode it
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Step 4: remove password and refresh token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Step 5: add user field in req object
    req.user = user;

    // Step 6: call the next function to proceed with the secured route
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
