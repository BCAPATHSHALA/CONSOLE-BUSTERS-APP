import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addSkills,
  createHomeWelcomeMessage,
  createPortfolio,
  deleteResume,
  updateResume,
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

export default router;
