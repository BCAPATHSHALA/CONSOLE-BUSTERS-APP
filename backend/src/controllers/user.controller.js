import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

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
};