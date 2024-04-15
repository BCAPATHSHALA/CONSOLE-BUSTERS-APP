import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Portfolio } from "../models/portfolio/portfolio.model.js";
import { AboutMe } from "../models/portfolio/aboutme.model.js";

// Level 1: Portfolio
const createPortfolio = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });

  // If the portfolio does not exist, create the portfolio first time
  if (!portfolio) {
    portfolio = await Portfolio.create({
      owner: userID,
    });

    if (!portfolio) {
      throw new ApiError(
        500,
        "Something went wrong while creating home message"
      );
    }
  } else {
    throw new ApiError(
      409,
      `${req.user?.fullName}, your portfolio already created`
    );
  }

  // Step 3: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {},
        `${req.user?.fullName}, your portfolio created successfully`
      )
    );
});

const createHomeWelcomeMessage = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Retrieve data from the request body
  const { homeMessage } = req.body;
  if (!homeMessage) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: Find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(
      404,
      `${req.user?.fullName}, please first create your portfolio`
    );
  }

  // Step 4: set welcome message
  await Portfolio.findByIdAndUpdate(
    portfolio._id,
    {
      $set: {
        home: homeMessage,
      },
    },
    { new: true }
  );

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, "Home welcome message created successfully")
    );
});

const uploadResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: get a local path of resume file
  const resumeLocalPath = req.file?.path;
  if (!resumeLocalPath) {
    throw new ApiError(400, "Resume file is missing");
  }

  // Step 3: upload resume file from local disk to cloudinary
  const resume = await uploadOnCloudinary(resumeLocalPath);
  if (!resume.url) {
    throw new ApiError(400, "Error while uploading the resume");
  }

  // Step 4: Find the user's portfolio based on their ID to upload the resume
  const portfolio = await Portfolio.findOne({ owner: userID });
  portfolio.resume = resume.url;
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Resume uploaded successfully"));
});

const updateResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: get a local path of new resume file
  const newResumeLocalPath = req.file?.path;
  if (!newResumeLocalPath) {
    throw new ApiError(400, "Resume file is missing");
  }

  // Step 3: upload resume file from local disk to cloudinary
  const resume = await uploadOnCloudinary(newResumeLocalPath);
  if (!resume.url) {
    throw new ApiError(400, "Error while updating the resume");
  }

  // Step 4: Find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Save old file url before updating with new file to delete the file from cloudinary
  const oldResume = await Portfolio.findOne({ owner: userID });

  // update the portfolio with resume field
  portfolio.resume = resume.url;
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: delete old resume file from cloudinary
  await deleteFromCloudinary(oldResume.resume);

  // Step 6: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Resume updated successfully"));
});

const deleteResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: update the portfolio with resume field
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Save file url before updating with resume = "" to delete the file from cloudinary
  const oldResume = await Portfolio.findOne({ owner: userID });
  portfolio.resume = "";
  await portfolio.save({ validateBeforeSave: false });

  // Step 3: delete exist resume file from cloudinary
  await deleteFromCloudinary(oldResume.resume);

  // Step 4: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume deleted successfully"));
});

const addSkills = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Retrieve data from the request body
  const { constructionOfSkill, nameOfSkill, levelOfSkill } = req.body;

  // Step 3: validation for not empty fields
  if (
    [constructionOfSkill, nameOfSkill, levelOfSkill].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Todo: can not add the duplicate skills
  const isDuplicateSkill = portfolio.skill.some(
    (skill) => skill.nameOfSkill.trim() === nameOfSkill.trim()
  );
  if (isDuplicateSkill) {
    throw new ApiError(409, `${nameOfSkill} allready added`);
  }

  // Step 5: Add the new skill to the portfolio
  portfolio.skill.push({
    constructionOfSkill,
    nameOfSkill,
    levelOfSkill,
  });

  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Skill added successfully"));
});

// Level 2: AboutMe
const createAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { content, tagline, gender } = req.body;

  // Step 3: validation for not empty fields
  if (content.trim() === "") {
    throw new ApiError(400, "Please write about yourself in short");
  }

  // Step 4: upload the profile image from local server to cloudinary
  const profileImageLocalPath = req.file?.path;
  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile image file is missing");
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);
  if (!profileImage.url) {
    throw new ApiError(400, "Error while uploading the profile image");
  }

  // Step 6: create aboutMe object
  let aboutMe;
  if (portfolio.aboutMe === undefined) {
    // Create about me first time
    aboutMe = await AboutMe.create({
      content,
      tagline,
      gender,
      profileImage: profileImage?.url || "",
    });

    if (!aboutMe) {
      throw new ApiError(500, "Something went wrong while adding about me");
    }

    // join aboutMe to the user's portfolio
    portfolio.aboutMe = aboutMe._id;
    await portfolio.save();
  } else {
    await deleteFromCloudinary(profileImage?.url);
    throw new ApiError(409, "AboutMe is already created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "AboutMe added successfully"));
});

const addHobbiesInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { hobby } = req.body;

  if (!hobby || hobby.trim() === "") {
    throw new ApiError(400, "Hobby field is required");
  }

  // Step 3: update aboutMe via hobbies
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Todo: can not add the duplicate hobby
  const isDuplicateHobby = aboutMe.hobbies.some(
    (existingHobby) =>
      existingHobby &&
      existingHobby.hobby &&
      existingHobby.hobby.trim() === hobby.trim()
  );
  if (isDuplicateHobby) {
    throw new ApiError(409, `${hobby} already added`);
  }

  // Step 4: Add the new hobby to aboutMe
  aboutMe.hobbies.push({ hobby });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Hobby added successfully"));
});

const addSocialLinksInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { platform, url } = req.body;

  if ([platform, url].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: update aboutMe via social links
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Todo: can not add the duplicate platform
  const isDuplicatePlatform = aboutMe.socialLinks.some(
    (existingPlatform) =>
      existingPlatform &&
      existingPlatform.platform &&
      existingPlatform.platform.trim() === platform.trim()
  );
  if (isDuplicatePlatform) {
    throw new ApiError(409, `${platform} already added`);
  }

  // Step 4: Add the new platform to aboutMe
  aboutMe.socialLinks.push({ platform, url });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, `${platform} added successfully`));
});

const addWorkExperienceInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { company, position, startTime, endTime, responsibilities } = req.body;

  if (
    [company, position, startTime, endTime, responsibilities].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: update aboutMe via work experience
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Step 4: Add the new work experience to aboutMe
  aboutMe.workExperience.push({
    company,
    position,
    startTime,
    endTime,
    responsibilities,
  });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return the response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, `${company}, work experience added successfully`)
    );
});

const addEducationInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { institution, degree, fieldOfStudy, graduationYear } = req.body;

  if (
    [institution, degree, fieldOfStudy, graduationYear].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 3: update aboutMe via education
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Todo: can not add the duplicate degree
  const isDuplicateDegree = aboutMe.education.some(
    (existingDegree) =>
      existingDegree &&
      existingDegree.degree &&
      existingDegree.degree.trim() === degree.trim()
  );
  if (isDuplicateDegree) {
    throw new ApiError(409, `${degree} already added`);
  }

  // Step 4: Add the new education to aboutMe
  aboutMe.education.push({ institution, degree, fieldOfStudy, graduationYear });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, `${degree} added successfully`));
});

const updateAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { content, tagline, gender } = req.body;

  // Step 3: validation for not empty fields
  if (!content || !tagline || !gender) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Update the content, tagline, or gender
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findByIdAndUpdate(
    aboutMeID,
    {
      $set: {
        content,
        tagline,
        gender,
      },
    },
    { new: true }
  );

  // Step 3: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "About me details updated successfully"));
});

const updateProfileImageInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: get a local path of new profile image file
  const newProfileImageLocalPath = req.file?.path;
  if (!newProfileImageLocalPath) {
    throw new ApiError(400, "Profile image file is missing");
  }

  // Step 3: upload profile image file from local disk to cloudinary
  const profileImage = await uploadOnCloudinary(newProfileImageLocalPath);
  if (!profileImage.url) {
    throw new ApiError(400, "Error while updating the profile image");
  }

  // Step 4: Find the user's portfolio aboutMe based on their ID
  const aboutMeID = portfolio.aboutMe.toString();
  const aboutMe = await AboutMe.findOne({ _id: aboutMeID });

  // Save old file url before updating with new file to delete the file from cloudinary
  const oldProfileImage = await AboutMe.findOne({ _id: aboutMeID });

  // update the portfolio with profileImage field
  aboutMe.profileImage = profileImage.url;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: delete old profileImage file from cloudinary
  await deleteFromCloudinary(oldProfileImage.profileImage);

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Profile image updated successfully"));
});

const deleteProfileImageInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 4: Find the user's portfolio aboutMe based on their ID
  const aboutMeID = portfolio.aboutMe.toString();
  const aboutMe = await AboutMe.findOne({ _id: aboutMeID });

  // Save old file url before updating with profileImage = "" to delete the file from cloudinary
  const oldProfileImage = await AboutMe.findOne({ _id: aboutMeID });

  aboutMe.profileImage = "";
  await aboutMe.save({ validateBeforeSave: false });

  // Step 3: delete exist profile image file from cloudinary
  await deleteFromCloudinary(oldProfileImage.profileImage);

  // Step 4: return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Profile image deleted successfully"));
});

const updateHobbyByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { hobbyId } = req.params;
  const { newHobby } = req.body;

  // Step 3: Validation for not empty fields
  if (!hobbyId || !newHobby) {
    throw new ApiError(400, "Hobby ID and updated hobby fields are required");
  }

  // Step 4: Find the aboutMe document and update the hobby
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the hobby with the given ID
  const hobbyIndex = aboutMe.hobbies.findIndex(
    (hobby) => hobby._id.toString() === hobbyId
  );

  if (hobbyIndex === -1) {
    throw new ApiError(404, "Hobby not found");
  }

  // Update the hobby at the found index
  aboutMe.hobbies[hobbyIndex].hobby = newHobby;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Hobby updated successfully"));
});

const deleteHobbyByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { hobbyId } = req.params;

  // Step 3: Validation for not empty fields
  if (!hobbyId) {
    throw new ApiError(400, "Hobby ID field is required");
  }

  // Step 4: Find the aboutMe document and update the hobby
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the hobby with the given ID
  const hobbyIndex = aboutMe.hobbies.findIndex(
    (hobby) => hobby._id.toString() === hobbyId
  );

  if (hobbyIndex === -1) {
    throw new ApiError(404, "Hobby not found");
  }

  // Delete the hobby at the found index
  aboutMe.hobbies.splice(hobbyIndex, 1);
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Hobby deleted successfully"));
});

const updateEducationByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { eduId } = req.params;
  const { newInstitution, newDegree, newFieldOfStudy, newGraduationYear } =
    req.body;

  // Step 3: Validation for not empty fields
  if (!newInstitution || !newDegree || !newFieldOfStudy || !newGraduationYear) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Find the aboutMe document and update the education
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the education with the given ID
  const eduIndex = aboutMe.education.findIndex(
    (edu) => edu._id.toString() === eduId
  );

  if (eduIndex === -1) {
    throw new ApiError(404, `${newDegree}, not found`);
  }

  // Update the education at the found index
  const newEducation = {
    institution: newInstitution,
    degree: newDegree,
    fieldOfStudy: newFieldOfStudy,
    graduationYear: newGraduationYear,
  };
  aboutMe.education[eduIndex] = newEducation;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Education updated successfully"));
});

const deleteEducationByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { eduId } = req.params;

  // Step 3: Validation for not empty fields
  if (!eduId) {
    throw new ApiError(400, "education ID field is required");
  }

  // Step 4: Find the aboutMe document and update the education
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the education with the given ID
  const eduIndex = aboutMe.education.findIndex(
    (edu) => edu._id.toString() === eduId
  );

  if (eduIndex === -1) {
    throw new ApiError(404, `Education not found`);
  }

  // Delete the education at the found index
  aboutMe.education.splice(eduIndex, 1);
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Education deleted successfully"));
});

const updateSocialLinkByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { socialLinkId } = req.params;
  const { newPlatform, newUrl } = req.body;

  // Step 3: Validation for not empty fields
  if (!newPlatform || !newUrl) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Find the aboutMe document and update the work experience
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the social links with the given ID
  const socialLinkIndex = aboutMe.socialLinks.findIndex(
    (socialLink) => socialLink._id.toString() === socialLinkId
  );

  if (socialLinkIndex === -1) {
    throw new ApiError(404, `${newPlatform}, social platform not found`);
  }

  // Update the social links at the found index
  const newSocialLink = {
    platform: newPlatform,
    url: newUrl,
  };
  aboutMe.socialLinks[socialLinkIndex] = newSocialLink;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Social link updated successfully"));
});

const deleteSocialLinkByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { socialLinkId } = req.params;

  // Step 3: Validation for not empty fields
  if (!socialLinkId) {
    throw new ApiError(400, "Social link ID field is required");
  }

  // Step 4: Find the aboutMe document
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the social link with the given ID
  const socialLinkIndex = aboutMe.socialLinks.findIndex(
    (socialLink) => socialLink._id.toString() === socialLinkId
  );

  if (socialLinkIndex === -1) {
    throw new ApiError(404, `Social link not found`);
  }

  // Delete the social link at the found index
  aboutMe.socialLinks.splice(socialLinkIndex, 1);
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Social link deleted successfully"));
});

const updateWorkExperienceByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { workExpId } = req.params;
  const {
    newCompany,
    newPosition,
    newStartTime,
    newEndTime,
    newResponsibilities,
  } = req.body;

  // Step 3: Validation for not empty fields
  if (
    !newResponsibilities ||
    !newEndTime ||
    !newStartTime ||
    !newPosition ||
    !newCompany
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Find the aboutMe document and update the work experience
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the work experience with the given ID
  const workExpIndex = aboutMe.workExperience.findIndex(
    (workExp) => workExp._id.toString() === workExpId
  );

  if (workExpIndex === -1) {
    throw new ApiError(404, `In ${newCompany}, work experience not found`);
  }

  // Update the work experience at the found index
  const newWorkExperience = {
    company: newCompany,
    position: newPosition,
    startTime: newStartTime,
    endTime: newEndTime,
    responsibilities: newResponsibilities,
  };
  aboutMe.workExperience[workExpIndex] = newWorkExperience;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Work experience updated successfully"));
});

const deleteWorkExperienceByIDInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request parameters
  const { workExpId } = req.params;

  // Step 3: Validation for not empty fields
  if (!workExpId) {
    throw new ApiError(400, "Work experience ID field is required");
  }

  // Step 4: Find the aboutMe document
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the social link with the given ID
  const workExpIndex = aboutMe.workExperience.findIndex(
    (workExp) => workExp._id.toString() === workExpId
  );

  if (workExpIndex === -1) {
    throw new ApiError(404, `Work experience not found`);
  }

  // Delete the work experience at the found index
  aboutMe.workExperience.splice(workExpIndex, 1);
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Work experience deleted successfully"));
});

export {
  createPortfolio,
  createHomeWelcomeMessage,
  uploadResume,
  updateResume,
  deleteResume,
  addSkills,
  createAboutMe,
  addHobbiesInAboutMe,
  addSocialLinksInAboutMe,
  addWorkExperienceInAboutMe,
  addEducationInAboutMe,
  updateAboutMe,
  updateProfileImageInAboutMe,
  deleteProfileImageInAboutMe,
  updateHobbyByIDInAboutMe,
  deleteHobbyByIDInAboutMe,
  updateEducationByIDInAboutMe,
  deleteEducationByIDInAboutMe,
  updateSocialLinkByIDInAboutMe,
  deleteSocialLinkByIDInAboutMe,
  updateWorkExperienceByIDInAboutMe,
  deleteWorkExperienceByIDInAboutMe,
};
