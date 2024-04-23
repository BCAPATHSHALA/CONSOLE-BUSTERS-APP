import express from "express";
import {
  upload,
  uploadPDF,
  uploadVideo,
} from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addAchievement,
  addCertificateDetails,
  addEducationInAboutMe,
  addHobbiesInAboutMe,
  addProject,
  addProjectTechStackById,
  addSkills,
  addSocialLinksInAboutMe,
  addTestimonial,
  addWorkExperienceInAboutMe,
  createAboutMe,
  createArticle,
  createHomeWelcomeMessage,
  createPortfolio,
  deleteAchievementById,
  deleteArticleById,
  deleteCertificateById,
  deleteCertificateImageById,
  deleteEducationByIDInAboutMe,
  deleteHobbyByIDInAboutMe,
  deleteHomeWelcomeMessage,
  deleteProfileImageInAboutMe,
  deleteProjectById,
  deleteProjectDocumentationPDFById,
  deleteProjectImageById,
  deleteProjectTechStackById,
  deleteProjectVideoById,
  deleteResume,
  deleteSkillById,
  deleteSocialLinkByIDInAboutMe,
  deleteTestimonialById,
  deleteWorkExperienceByIDInAboutMe,
  getAchievementById,
  getArticleById,
  getCertificateById,
  getProjectById,
  getTestimonialById,
  updateAboutMe,
  updateAchievementById,
  updateArticleById,
  updateCertificateDetailsById,
  updateCertificateImageById,
  updateEducationByIDInAboutMe,
  updateHobbyByIDInAboutMe,
  updateHomeWelcomeMessage,
  updateProfileImageInAboutMe,
  updateProjectById,
  updateProjectDocumentationPDFById,
  updateProjectImageById,
  updateProjectTechStackById,
  updateProjectVideoById,
  updateResume,
  updateSkillById,
  updateSocialLinkByIDInAboutMe,
  updateTestimonialById,
  updateWorkExperienceByIDInAboutMe,
  uploadCertificateImageById,
  uploadProjectDocumentationPDFById,
  uploadProjectImagesById,
  uploadProjectVideoById,
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
  .route("/users/portfolio/update-home-message")
  .patch(verifyJWT, updateHomeWelcomeMessage);

router
  .route("/users/portfolio/delete-home-message")
  .delete(verifyJWT, deleteHomeWelcomeMessage);

router
  .route("/users/portfolio/upload-resume")
  .post(verifyJWT, uploadPDF.single("resume"), uploadResume);

router
  .route("/users/portfolio/update-resume")
  .patch(verifyJWT, uploadPDF.single("resume"), updateResume);

router.route("/users/portfolio/delete-resume").delete(verifyJWT, deleteResume);

router.route("/users/portfolio/add-skills").post(verifyJWT, addSkills);
router
  .route("/users/portfolio/update-skill/:skillID")
  .patch(verifyJWT, updateSkillById);

router
  .route("/users/portfolio/delete-skill/:skillID")
  .delete(verifyJWT, deleteSkillById);

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

router.route("/users/portfolio/add-project").post(verifyJWT, addProject);

router
  .route("/users/portfolio/update-project/:projectID")
  .patch(verifyJWT, updateProjectById);

router
  .route("/users/portfolio/get-project/:projectID")
  .get(verifyJWT, getProjectById);

router
  .route("/users/portfolio/delete-project/:projectID")
  .delete(verifyJWT, deleteProjectById);

router
  .route("/users/portfolio/add-project-tech-stack/:projectID")
  .post(verifyJWT, addProjectTechStackById);

router
  .route("/users/portfolio/update-project-tech-stack/:techID")
  .patch(verifyJWT, updateProjectTechStackById);

router
  .route("/users/portfolio/delete-project-tech-stack/:techID")
  .delete(verifyJWT, deleteProjectTechStackById);

router
  .route("/users/portfolio/upload-project-images/:projectID")
  .post(verifyJWT, upload.array("images"), uploadProjectImagesById);

router
  .route("/users/portfolio/update-project-image/:imageID")
  .patch(verifyJWT, upload.single("images"), updateProjectImageById);

router
  .route("/users/portfolio/delete-project-image/:imageID")
  .delete(verifyJWT, deleteProjectImageById);

router
  .route("/users/portfolio/upload-project-video/:projectID")
  .post(verifyJWT, uploadVideo.single("demoVideo"), uploadProjectVideoById);

router
  .route("/users/portfolio/update-project-video/:projectID")
  .patch(verifyJWT, uploadVideo.single("demoVideo"), updateProjectVideoById);

router
  .route("/users/portfolio/delete-project-video/:projectID")
  .delete(verifyJWT, deleteProjectVideoById);

router
  .route("/users/portfolio/upload-project-documentation-pdf/:projectID")
  .post(
    verifyJWT,
    uploadPDF.single("docPDF"),
    uploadProjectDocumentationPDFById
  );

router
  .route("/users/portfolio/update-project-documentation-pdf/:projectID")
  .patch(
    verifyJWT,
    uploadPDF.single("docPDF"),
    updateProjectDocumentationPDFById
  );

router
  .route("/users/portfolio/delete-project-documentation-pdf/:projectID")
  .delete(verifyJWT, deleteProjectDocumentationPDFById);

router.route("/users/portfolio/create-article").post(verifyJWT, createArticle);

router
  .route("/users/portfolio/update-article/:articleID")
  .patch(verifyJWT, updateArticleById);

router
  .route("/users/portfolio/get-article/:articleID")
  .get(verifyJWT, getArticleById);

router
  .route("/users/portfolio/delete-article/:articleID")
  .delete(verifyJWT, deleteArticleById);

router
  .route("/users/portfolio/add-certificate-details")
  .post(verifyJWT, addCertificateDetails);

router
  .route("/users/portfolio/update-certificate-details/:certificateID")
  .patch(verifyJWT, updateCertificateDetailsById);

router
  .route("/users/portfolio/get-certificate/:certificateID")
  .get(verifyJWT, getCertificateById);

router
  .route("/users/portfolio/delete-certificate/:certificateID")
  .delete(verifyJWT, deleteCertificateById);

router
  .route("/users/portfolio/upload-certificate-image/:certificateID")
  .post(verifyJWT, upload.single("image"), uploadCertificateImageById);

router
  .route("/users/portfolio/update-certificate-image/:certificateID")
  .patch(verifyJWT, upload.single("image"), updateCertificateImageById);

router
  .route("/users/portfolio/delete-certificate-image/:certificateID")
  .delete(verifyJWT, deleteCertificateImageById);

router
  .route("/users/portfolio/add-achievement")
  .post(verifyJWT, addAchievement);

router
  .route("/users/portfolio/update-achievement/:achievementID")
  .patch(verifyJWT, updateAchievementById);

router
  .route("/users/portfolio/get-achievement/:achievementID")
  .get(verifyJWT, getAchievementById);

router
  .route("/users/portfolio/delete-achievement/:achievementID")
  .delete(verifyJWT, deleteAchievementById);

router
  .route("/users/portfolio/add-testimonial")
  .post(verifyJWT, addTestimonial);

router
  .route("/users/portfolio/update-testimonial/:testimonialID")
  .patch(verifyJWT, updateTestimonialById);

router
  .route("/users/portfolio/get-testimonial/:testimonialID")
  .get(verifyJWT, getTestimonialById);

router
  .route("/users/portfolio/delete-testimonial/:testimonialID")
  .delete(verifyJWT, deleteTestimonialById);

export default router;
