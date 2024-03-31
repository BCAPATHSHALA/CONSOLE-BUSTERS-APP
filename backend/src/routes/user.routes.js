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
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { authorizedAdmin, verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/users/register").post(
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

router.route("/users/email-verification").post(sendEmailVerificationLink);
router.route("/users/email-verification/:resetToken").patch(verifyEmail);
router.route("/users/forgot-password").post(forgotPassword);
router.route("/users/reset-password/:resetToken").patch(resetPassword);

router.route("/users/login").post(loginUser);
router.route("/users/verify-otp-while-login").patch(verifyOTPWhileLoging);

// Secure Routes
router.route("/users/logout").post(verifyJWT, logoutUser);
router.route("/users/refresh").post(refreshAccessToken);
router
  .route("/users/send-otp-for-two-step-verification")
  .post(verifyJWT, sendOTPForTwoStepVerification);
router
  .route("/users/verify-otp-for-two-step-verification")
  .patch(verifyJWT, verifyOTPToToggleTwoStepVerification);

router.route("/users/profile").get(verifyJWT, getUserProfile);
router
  .route("/users/update-account-details")
  .patch(verifyJWT, updateUserProfile);
router
  .route("/users/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/users/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/users/delete-avatar").delete(verifyJWT, deleteUserAvatar);
router
  .route("/users/delete-cover-image")
  .delete(verifyJWT, deleteUserCoverImage);
router.route("/users/delete-profile").delete(verifyJWT, deleteUserProfile);

// Admin secure routes api/v1/users/admin
router.route("/admin/users").get(verifyJWT, authorizedAdmin, getAllUsers);
router
  .route("/admin/user/:id")
  .get(verifyJWT, authorizedAdmin, getSingleUserByID)
  .patch(verifyJWT, authorizedAdmin, updateSingleUserByID)
  .delete(verifyJWT, authorizedAdmin, deleteSingleUserByID);

router
  .route("/admin/user/block-unblock/:id")
  .patch(verifyJWT, authorizedAdmin, blockAndUnblockSingleUserByID);

export default router;
