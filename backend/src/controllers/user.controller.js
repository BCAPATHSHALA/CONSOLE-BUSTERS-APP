import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/auth/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { ApiFeatures } from "../utils/apiFeatures.js";
import { BLOCK_EXPIRY } from "../constants.js";
import mongoose from "mongoose";
import fs from "fs";

// Method to generate the access and refresh token
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

// Method to send OTP while login
const sendOTPWhileLogin = async (user) => {
  // Step 1: Generate and send OTP
  const randomOTP = user.generateRandomOTPToken();
  user.save({ validateBeforeSave: false });

  const message = `
       <p>Your One-Time Password (OTP) for two-step verification is: <strong>${randomOTP}</strong></p>
       <p>Please enter this OTP to complete the verification process.</p>
       <p>If you didn't request this OTP, you can safely ignore this message.</p>  
      `;

  const response = await sendEmail(
    user.email,
    "Console Busters Two-Step Verification",
    message
  );

  return response;
};

// Method to unblock a user
const unblockUser = async (userId) => {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $set: { isBlocked: false, blockedUntil: null } },
      { new: true }
    );
    console.log(`User ${userId} has been unblocked.`);
  } catch (error) {
    console.error(`Error unblocking user: ${error.message}`);
  }
};

// Method to validate the Avatar and CoverImage are image or not
const validateImageUploads = (req) => {
  const avatarFiles = req.files["avatar"];
  const coverImageFiles = req.files["coverImage"];

  // Validate avatar files
  if (!avatarFiles || !avatarFiles[0].mimetype.startsWith("image/")) {
    if (avatarFiles && avatarFiles[0].path) {
      // Remove uploaded avatar file from local disk
      fs.unlinkSync(avatarFiles[0].path);
    }
    throw new ApiError(400, "Please upload an image file only");
  }

  // Validate cover image files
  if (!coverImageFiles || !coverImageFiles[0].mimetype.startsWith("image/")) {
    if (coverImageFiles && coverImageFiles[0].path) {
      // Remove uploaded cover image file from local disk
      fs.unlinkSync(coverImageFiles[0].path);
    }
    throw new ApiError(400, "Please upload an image file only");
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

  // TODO: Validate the file mimetype for avatar and coverImage
  if (avatarLocalPath) {
    validateImageUploads(req);
  }
  if (coverImageLocalPath) {
    validateImageUploads(req);
  }

  // Step 5: upload images from server to cloudinary, check for avatar*
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Step 6: create user object - create a user entry in DB
  const user = await User.create({
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

  // Todo: check email is verified or not (Handled by Frontend Developer: redirect to the send email verification page)
  if (!user.isVerify) {
    throw new ApiError(400, "Please first verify your registered email");
  }

  // Todo: check user is blocked or unblocked
  if (user.isBlocked) {
    throw new ApiError(
      400,
      `You are temporarily blocked for ${BLOCK_EXPIRY} days.`
    );
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

  // Todo: send OTP for two step verification
  let message = "User logged in successfully";
  if (user.isTwoStepVerification) {
    // function call to send OTP to registered email before saving the cookies
    const response = await sendOTPWhileLogin(user);
    // Todo: Handled By Frontend Developer: to redirect to the verify OTP page while login
    if (response) {
      message = "OTP sent successfully to your registered email";
    } else {
      user.otpToken = undefined;
      user.otpTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(404, "Error sending email");
    }
  }

  // Step 8: send cookies with returning the response
  const options = {
    // This option makes not modifiable cookies from the client side
    httpOnly: true,
    secure: true,
  };

  if (message === "User logged in successfully") {
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
          message
        )
      );
  } else if (message === "OTP sent successfully to your registered email") {
    return res.status(200).json(new ApiResponse(200, {}, message));
  }
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

const forgotPassword = asyncHandler(async (req, res) => {
  // Step 1: get email from user and check it is exist in DB or not
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Invalid registered email or user does not exist");
  }

  // Step 2: generate reset token and save user
  const resetToken = await user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Step 3: create reset new password link and send message
  const url = `${process.env.CORS_ORIGIN}/api/v1/users/reset-password/${resetToken}`;
  const message = `
     <p>Click on the link below to reset your new password:</p>
     <p><a href="${url}">Reset New Password</a></p>
     <p>If you didn't request this email, you can safely ignore it.</p>
     `;

  // Step 4: send reset password link to the user's email
  const response = await sendEmail(
    user.email,
    "Console Busters Reset New Password",
    message
  );

  // Step 5: check message sent or not
  if (!response) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError(404, "Error sending email");
  }

  // Step 6: return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { resetToken: resetToken },
        "Reset password link sent successfully to your registered email."
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  // Step 1: get reset token from reset password link
  const { resetToken } = req.params;

  // Step 2: hash reset token to check with DB reset token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpiry: {
      $gt: Date.now(),
    },
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(
      401,
      "Reset password token is invalid or has been expired"
    );
  }

  // Step 3: get new password from user
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    throw new ApiError(400, "Both fields are required");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "Password does not match");
  }

  // Step 3: set the new password and update the token and expiry
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Step 4: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully."));
});

const sendEmailVerificationLink = asyncHandler(async (req, res) => {
  // Step 1: get email from user and check it is exist in DB or not
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Invalid registered email or user does not exist");
  }

  if (user.isVerify) {
    throw new ApiError(400, "Email address is already verified");
  }

  // Step 2: generate reset token and save user
  const resetToken = await user.getResetVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Step 3: create create verification email url and send message
  const url = `${process.env.CORS_ORIGIN}/api/v1/users/email-verification/${resetToken}`;
  const message = `
     <p>Click on the link below to verify your email address:</p>
     <p><a href="${url}">Verify Email</a></p>
     <p>If you didn't request this email, you can safely ignore it.</p>
     `;

  // Step 4: send email verification message to the user's email
  const response = await sendEmail(
    user.email,
    "Console Busters Email Verification",
    message
  );

  // Step 5: check message sent or not
  if (!response) {
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError(404, "Error sending email");
  }

  // Step 6: return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { resetToken: resetToken },
        "Verification email sent successfully to your registered email."
      )
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  // Step 1: get reset token from email verification link
  const { resetToken } = req.params;

  // Step 2: hash reset token to check with DB reset token
  const verificationToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    verificationToken,
    verificationTokenExpiry: {
      $gt: Date.now(),
    },
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(
      401,
      "Email verification token is invalid or has been expired"
    );
  }

  // Step 3: set the isVerify: true and update the token and expiry
  user.isVerify = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Step 4: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully."));
});

const sendOTPForTwoStepVerification = asyncHandler(async (req, res) => {
  // Step 1: veryJWT to get the user's id
  const userID = req.user._id;
  if (!userID) {
    throw new ApiError(401, "unauthorized request");
  }

  // Step 2: find user is exist or not
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  // Step 3: get user's password
  const { password } = req.body;

  // Step 4: verify the input password from DB password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  // Step 5: Generate and send OTP
  const randomOTP = user.generateRandomOTPToken();
  user.save({ validateBeforeSave: false });

  const message = `
      <p>Your One-Time Password (OTP) for two-step verification is: <strong>${randomOTP}</strong></p>
      <p>Please enter this OTP to complete the verification process.</p>
      <p>If you didn't request this OTP, you can safely ignore this message.</p>  
     `;

  const response = await sendEmail(
    user.email,
    "Console Busters Two-Step Verification",
    message
  );

  // Step 6: check OTP message sent or not
  if (!response) {
    user.otpToken = undefined;
    user.otpTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError(404, "Error sending email");
  }

  // Step 7: return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { randomOTP: randomOTP },
        "OTP sent successfully to your registered email."
      )
    );
});

const verifyOTPToToggleTwoStepVerification = asyncHandler(async (req, res) => {
  // Step 1: veryJWT to get the user's id
  const userID = req.user._id;
  if (!userID) {
    throw new ApiError(401, "unauthorized request");
  }

  // Step 2: get OTP from user
  const { randomOTP } = req.body;

  // Step 3: hash random OTP and verify it
  const otpToken = crypto.createHash("sha256").update(randomOTP).digest("hex");

  const user = await User.findOne({
    otpToken,
    otpTokenExpiry: {
      $gt: Date.now(),
    },
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid OTP or has been expired");
  }

  // Step 4: toggle two step verification and update the token and expiry
  user.isTwoStepVerification = user.isTwoStepVerification ? false : true;
  user.otpToken = undefined;
  user.otpTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Step 5: return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Two-step verification has been enabled successfully."
      )
    );
});

const verifyOTPWhileLoging = asyncHandler(async (req, res) => {
  // Step 1: get OTP from user
  const { randomOTP } = req.body;

  if (!randomOTP) {
    throw new ApiError("OTP is required");
  }

  // Step 2: hash random OTP and verify it
  const otpToken = crypto.createHash("sha256").update(randomOTP).digest("hex");

  const user = await User.findOne({
    otpToken,
    otpTokenExpiry: {
      $gt: Date.now(),
    },
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid OTP or has been expired");
  }

  // Step 3: generate the access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Step 4: update the token and expiry
  user.otpToken = undefined;
  user.otpTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Step 5: send cookies with returning the response
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
          user,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  // Step 1: veryJWT to get the user's id
  const userID = req.user?._id;

  // Step 2: get user from DB via userID & remove sensitive information from user
  const user = await User.findById(userID).select("-password -refreshToken");

  // Step 3: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  // Important Question: What do I want to update the specific field?
  // Answer: I want to update three fields are email, username and fullname

  // Step 1: get email, username and fullname from user
  const { fullName, email, username } = req.body;
  if (!fullName || !email || !username) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 2: get user id to update the modified fields in DB
  const userID = req.user?._id;
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        fullName,
        email: email,
        username,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  // Step 3: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Step 1: get a local path of new avatar image
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload an image file only");
  }

  // Step 2: upload new avatar image from local disk to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  // Step 3: get user id to update the user's avatar filed with new avatar image in DB
  const userID = req.user?._id;
  // Save old file url before updating with new file to delete the file from cloudinary
  const oldAvatar = await User.findById(userID);
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // Step 4: delete old avatar image from cloudinary
  await deleteFromCloudinary(oldAvatar.avatar);

  // Step 5: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Step 1: get a local path of new cover image
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload an image file only");
  }

  // Step 2: upload new cover image from local disk to cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  // Step 3: get user id to update the user's cover image filed with new cover image in DB
  const userID = req.user?._id;
  // Save old file url before updating with new file to delete the file from cloudinary
  const oldCoverImage = await User.findById(userID);
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  // Step 4: delete old cover image from cloudinary
  await deleteFromCloudinary(oldCoverImage.coverImage);

  // Step 5: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const deleteUserAvatar = asyncHandler(async (req, res) => {
  // Step 1: get user id to update the user's avatar = ""
  const userID = req.user?._id;
  // Save old file url before updating with avatar = "" to delete the file from cloudinary
  const oldAvatar = await User.findById(userID);
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        avatar: "",
      },
    },
    { new: true }
  ).select("-password");

  // Step 2: delete old avatar image from cloudinary
  await deleteFromCloudinary(oldAvatar.avatar);

  // Step 3: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image deleted successfully"));
});

const deleteUserCoverImage = asyncHandler(async (req, res) => {
  // Step 1: get user id to update the user's coverImage = ""
  const userID = req.user?._id;
  // Save old file url before updating with coverImage = "" to delete the file from cloudinary
  const oldCoverImage = await User.findById(userID);
  const user = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        coverImage: "",
      },
    },
    { new: true }
  ).select("-password");

  // Step 2: delete old cover image from cloudinary
  await deleteFromCloudinary(oldCoverImage.coverImage);

  // Step 3: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image deleted successfully"));
});

const deleteUserProfile = asyncHandler(async (req, res) => {
  // Step 1: veryJWT to get the user's id
  const userID = req.user?._id;

  // Step 2: delete avatar and covver image from cloudinary
  const user = await User.findById(userID);
  await deleteFromCloudinary(user?.avatar);
  await deleteFromCloudinary(user?.coverImage);

  // console.log("user::::", user.fullName);

  // Step 3: delete user from DB
  await User.deleteOne({ _id: userID });

  // Step 4: clear the cookies and return the response to the client
  const options = {
    // This option makes not modifiable cookies from the client side
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

// Admin APIs

const getAllUsers = asyncHandler(async (req, res) => {
  // Get the users (collection) from DB by username (query keyword)
  // const users = await User.find({ username: { $regex: "Manoj", $options: "i" } });
  // Get the 5 users document per page
  // const users = await User.find().limit(5).skip(5);

  const resultPerPage = 5;
  const userCount = await User.countDocuments();

  // Step 1: Set both in class ApiFeatures(which collection, what query)
  const apiFeatures = new ApiFeatures(User.find(), req.query);

  // Step 2: Get the user collection from DB
  const users = await apiFeatures
    .searchUser()
    .filterUser()
    .paginateUser(resultPerPage).queryObject;

  // Step 3: Return response to ADMIN
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users, userCount, resultPerPage },
        "Users fetched successfully"
      )
    );
});

const getSingleUserByID = asyncHandler(async (req, res) => {
  // Step 1: get user id from URL
  const { id } = req.params;

  // Step 2: get user from DB
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Step 3: return response to ADMIN
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateSingleUserByID = asyncHandler(async (req, res) => {
  // Step 1: get user id from URL
  const { id } = req.params;

  // Step 2: get user from DB
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 3: get user details for updating (Admin want to update the users role and email)
  const { email, role } = req.body;
  if (!email || !role) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: update the modified fields in DB
  user.email = email;
  user.role = role;
  user.save({ validateBeforeSave: false });

  // Step 5: return response to ADMIN
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const deleteSingleUserByID = asyncHandler(async (req, res) => {
  // Step 1: get user id from URL
  const { id } = req.params;

  // Step 2: get user from DB
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 2: delete avatar and cover image from cloudinary
  await deleteFromCloudinary(user?.avatar);
  await deleteFromCloudinary(user?.coverImage);

  // Step 3: delete user from DB
  await User.deleteOne({ _id: id });

  // Step 4: return response to ADMIN
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

const blockAndUnblockSingleUserByID = asyncHandler(async (req, res) => {
  // Step 1: Get user id from URL
  const { id } = req.params;

  // Step 2: Get user from DB
  const user = await User.findById({ _id: id });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Step 3: Toggle the field isBlocked
  user.isBlocked = !user.isBlocked;
  let message = "";

  if (user.isBlocked) {
    // User is being blocked, set blockedUntil to two days from now
    user.blockedUntil = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days
    message = "User blocked successfully";
  } else {
    // User is being unblocked, set blockedUntil to undefined
    user.blockedUntil = undefined;
    message = "User unblocked successfully";
  }

  // Step 4: Save the user changes
  await user.save({ validateBeforeSave: false });

  // Step 5: Return response to ADMIN
  return res.status(200).json(new ApiResponse(200, user, message));
});

// User routes for getting the portfolio details
const getPortfolioAsOwner = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user?._id;

  // Step 2: write the mongodb pipline to get the portfolio
  const portfolio = await User.aggregate([
    {
      // Stage 1: Get a particular user from DB Collection: users
      $match: {
        _id: new mongoose.Types.ObjectId(userID),
      },
    },
    {
      // Stage 2: Add two collections portfolios(foreign) and users(input) for portfolio as result
      $lookup: {
        from: "portfolios",
        localField: "_id",
        foreignField: "owner",
        as: "portfolio",
        pipeline: [
          // Sub Pipeline For Getting The Owner Details [portfolios(input) and users(foreign)]
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
          // [portfolios(input) and aboutMe(foreign)]
          {
            $lookup: {
              from: "aboutmes",
              localField: "aboutMe",
              foreignField: "_id",
              as: "aboutMe",
              pipeline: [
                {
                  $project: {
                    education: 1,
                    content: 1,
                    hobbies: 1,
                    profileImage: 1,
                    gender: 1,
                    workExperience: 1,
                    socialLinks: 1,
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
              aboutMe: {
                $first: "$aboutMe",
              },
            },
          },
        ],
      },
    },
    {
      // Stage 3: convert array field "portfolio" into object field "portfolio"
      $addFields: {
        portfolio: {
          $first: "$portfolio",
        },
      },
    },
    {
      // State 4: Return the specific fields from the collcetion: users
      $project: {
        _id: 0,
        portfolio: 1,
      },
    },
  ]);

  if (!portfolio?.length) {
    throw new ApiError(404, "Portfolio does not exists");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, portfolio[0], "Portfolio fetched successfully"));
});

export {
  registerUser,
  sendEmailVerificationLink,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  sendOTPForTwoStepVerification,
  verifyOTPToToggleTwoStepVerification,
  verifyOTPWhileLoging,
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,
  deleteUserAvatar,
  deleteUserCoverImage,
  deleteUserProfile,
  getAllUsers,
  getSingleUserByID,
  updateSingleUserByID,
  deleteSingleUserByID,
  blockAndUnblockSingleUserByID,
  unblockUser,
  getPortfolioAsOwner,
};
