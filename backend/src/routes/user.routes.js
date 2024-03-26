import express from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  sendEmailVerificationLink,
  verifyEmail,
  sendOTPForTwoStepVerification,
  verifyOTPToToggleTwoStepVerification,
  verifyOTPWhileLoging,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/register").post(
  // Step 1: get user details from frontend
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/email-verification").post(sendEmailVerificationLink);
router.route("/email-verification/:resetToken").patch(verifyEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").patch(resetPassword);

router.route("/login").post(loginUser);
router.route("/verify-otp-while-login").patch(verifyOTPWhileLoging);

// Secure Routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh").post(refreshAccessToken);
router
  .route("/send-otp-for-two-step-verification")
  .post(verifyJWT, sendOTPForTwoStepVerification);
router
  .route("/verify-otp-for-two-step-verification")
  .patch(verifyJWT, verifyOTPToToggleTwoStepVerification);

export default router;
