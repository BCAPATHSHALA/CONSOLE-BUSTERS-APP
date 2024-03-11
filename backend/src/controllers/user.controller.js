import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Now add new refresh token to the exist user entry in DB
    user.refreshToken = refreshToken;
    // Save the exist user without validation
    await user.save({ validateBeforeSave: false });
    // Now returning both access and refresh token to client
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // Step 1: get user details from frontend
  const { email, username, password } = req.body;

  // Step 2: validation for not empty fields
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Step 3: find the exist user based on username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // Step 4: check user does exist or not
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 5: verify the input password from DB password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Step 6: generate the access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Step 7: remove password and refresh token from response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 8: send cookies with returning the response
  const options = {
    // This option makes not modifiable cookies from the client side
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Step 1: veryJWT to get the user's id
  const userID = req.user._id;

  // Step 2: update the exist refresh token in DB
  await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // This is used to new updated data like refreshToken: undefined
      new: true,
    }
  );

  // Step 3: clear the cookies and return the response to the client
  const options = {
    // This option makes not modifiable cookies from the client side
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Step 1: get refresh token from cookies and validate
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    // Step 2: decode the incomingRefreshToken
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Step 3: find user from db for getting the old refreshToken to compare with incomingRefreshToken
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Step 4: compare old refreshToken with incomingRefreshToken
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Step 5: generate new accessToken and refreshToken
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // Step 6: return response with cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
