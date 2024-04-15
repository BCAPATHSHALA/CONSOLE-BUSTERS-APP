import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addEducationInAboutMe,
  addHobbiesInAboutMe,
  addSkills,
  addSocialLinksInAboutMe,
  addWorkExperienceInAboutMe,
  createAboutMe,
  createHomeWelcomeMessage,
  createPortfolio,
  deleteEducationByIDInAboutMe,
  deleteHobbyByIDInAboutMe,
  deleteProfileImageInAboutMe,
  deleteResume,
  deleteSocialLinkByIDInAboutMe,
  deleteWorkExperienceByIDInAboutMe,
  updateAboutMe,
  updateEducationByIDInAboutMe,
  updateHobbyByIDInAboutMe,
  updateProfileImageInAboutMe,
  updateResume,
  updateSocialLinkByIDInAboutMe,
  updateWorkExperienceByIDInAboutMe,
  uploadResume,
} from "../controllers/portfolio.controller.js";

const router = express.Router();

// User Secure Routes
router
  .route("/users/portfolio/create-portfolio")
  .post(verifyJWT, createPortfolio);
router
  .route("/users/portfolio/create-home-message")
  .post(verifyJWT, createHomeWelcomeMessage);

router
  .route("/users/portfolio/upload-resume")
  .post(verifyJWT, upload.single("resume"), uploadResume);
router
  .route("/users/portfolio/update-resume")
  .patch(verifyJWT, upload.single("resume"), updateResume);
router.route("/users/portfolio/delete-resume").delete(verifyJWT, deleteResume);

router.route("/users/portfolio/add-skills").post(verifyJWT, addSkills);
router
  .route("/users/portfolio/add-about-me")
  .post(verifyJWT, upload.single("profileImage"), createAboutMe);

router
  .route("/users/portfolio/add-hobbies")
  .post(verifyJWT, addHobbiesInAboutMe);

router
  .route("/users/portfolio/add-social-links")
  .post(verifyJWT, addSocialLinksInAboutMe);

router
  .route("/users/portfolio/add-work-experience")
  .post(verifyJWT, addWorkExperienceInAboutMe);

router
  .route("/users/portfolio/add-education")
  .post(verifyJWT, addEducationInAboutMe);

router
  .route("/users/portfolio/update-about-me")
  .patch(verifyJWT, updateAboutMe);
router
  .route("/users/portfolio/update-profile-image")
  .patch(verifyJWT, upload.single("profileImage"), updateProfileImageInAboutMe);

router
  .route("/users/portfolio/delete-profile-image")
  .delete(verifyJWT, deleteProfileImageInAboutMe);

router
  .route("/users/portfolio/update-hobby/:hobbyId")
  .patch(verifyJWT, updateHobbyByIDInAboutMe);

router
  .route("/users/portfolio/delete-hobby/:hobbyId")
  .delete(verifyJWT, deleteHobbyByIDInAboutMe);

router
  .route("/users/portfolio/update-education/:eduId")
  .patch(verifyJWT, updateEducationByIDInAboutMe);

router
  .route("/users/portfolio/delete-education/:eduId")
  .delete(verifyJWT, deleteEducationByIDInAboutMe);

router
  .route("/users/portfolio/update-social-link/:socialLinkId")
  .patch(verifyJWT, updateSocialLinkByIDInAboutMe);

router
  .route("/users/portfolio/delete-social-link/:socialLinkId")
  .delete(verifyJWT, deleteSocialLinkByIDInAboutMe);

router
  .route("/users/portfolio/update-work-experience/:workExpId")
  .patch(verifyJWT, updateWorkExperienceByIDInAboutMe);

router
  .route("/users/portfolio/delete-work-experience/:workExpId")
  .delete(verifyJWT, deleteWorkExperienceByIDInAboutMe);

export default router;
