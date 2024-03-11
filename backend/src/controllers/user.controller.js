import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Step 1: get user details from frontend
  const { fullName, email, username, password } = req.body;

  // Step 2: validation for not empty fields
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: check if user already exist or not using username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Step 4: check images are uploded on server or not
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // Step 5: upload images from server to cloudinary, check for avatar*
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Step 6: create user object - create a user entry in DB
  const user = User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    password,
  });

  // Step 7: remove password and refresh token from response
  const createUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // Step 8: check for user is created or not in DB
  if (!createUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Step 9: return the JSON response to the client
  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User registered successfully"));
});

export { registerUser };
