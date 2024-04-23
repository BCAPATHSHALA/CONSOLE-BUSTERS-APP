import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  deleteFromCloudinary,
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Portfolio } from "../models/portfolio/portfolio.model.js";
import { AboutMe } from "../models/portfolio/aboutme.model.js";
import { Project } from "../models/portfolio/project.model.js";
import fs from "fs";
import { validateVideoDuration } from "../utils/validator.js";
import { Article } from "../models/portfolio/article.model.js";
import { Certificate } from "../models/portfolio/certificate.model.js";
import { Achievement } from "../models/portfolio/achievement.model.js";
import { Testimonial } from "../models/portfolio/testimonial.model.js";
import { ContactMe } from "../models/portfolio/contactme.model.js";
import { platform } from "os";
import { url } from "inspector";

// Level 1: Portfolio
const createPortfolio = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Find the user's portfolio based on their ID
  let portfolio = await Portfolio.findOne({ owner: userID });

  // If the portfolio does not exist, create it for the first time
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

  // Step 4: Set the home welcome message
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

const updateHomeWelcomeMessage = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Retrieve data from the request body
  const { newHomeMessage } = req.body;
  if (!newHomeMessage) {
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

  // Step 4: Set the home welcome message
  await Portfolio.findByIdAndUpdate(
    portfolio._id,
    {
      $set: {
        home: newHomeMessage,
      },
    },
    { new: true }
  );

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, "Home welcome message updated successfully")
    );
});

const deleteHomeWelcomeMessage = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(
      404,
      `${req.user?.fullName}, please first create your portfolio`
    );
  }

  // Step 3: Set default home welcome message
  await Portfolio.findByIdAndUpdate(
    portfolio._id,
    {
      $set: {
        home: "Welcome to Console Busters",
      },
    },
    { new: true }
  );

  // Step 4: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, "Home welcome message deleted successfully")
    );
});

const uploadResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Check if a file is uploaded to local server and it's a PDF
  if (!req.file || !req.file?.mimetype.startsWith("application/pdf")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a PDF file");
  }

  const resumeLocalPath = req.file?.path;

  // Step 3: Find the portfolio to check resume field is already exist or not
  let portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }
  if (!portfolio?.resume) {
    // Step 4: Resume field is not already exist

    // ACTION 1: Upload the resume file from the local disk to cloudinary
    const resume = await uploadOnCloudinary(resumeLocalPath);
    if (!resume?.url) {
      throw new ApiError(400, "Error while uploading the resume PDF");
    }

    // Action 2: Update the resume field via cloudinary resume URL
    portfolio.resume = resume.url;
    await portfolio.save({ validateBeforeSave: false });
  } else {
    // Step 5: Resume field is already exist

    // Action 1: Delete the resume from local disk
    fs.unlinkSync(req.file?.path);

    // Action 2: Throw an error to the user
    throw new ApiError(400, "Maximum of 1 resume PDF is allowed");
  }

  // Step 6: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Resume uploaded successfully"));
});

const updateResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Check if a file is uploaded to local server and it's a PDF
  if (!req.file || !req.file?.mimetype.startsWith("application/pdf")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a PDF file");
  }

  const newResumeLocalPath = req.file?.path;

  // Step 3: Find the portfolio to check resume field is already exist or not
  let portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Save the old resume URL before updating with the new file to delete the file from cloudinary
  const oldResume = await Portfolio.findOne({ owner: userID });

  if (portfolio?.resume) {
    // Step 4: Resume field is already exist

    // ACTION 1: Upload the resume file from the local disk to cloudinary
    const resume = await uploadOnCloudinary(newResumeLocalPath);
    if (!resume?.url) {
      throw new ApiError(400, "Error while uploading the resume PDF");
    }

    // Action 2: Update the resume field via cloudinary resume URL
    portfolio.resume = resume.url;
    await portfolio.save({ validateBeforeSave: false });
  } else {
    // Step 5: Resume field is not already exist

    // Action 1: Delete the resume from local disk
    fs.unlinkSync(req.file?.path);

    // Action 2: Throw an error to the user
    throw new ApiError(400, "First upload resume PDF");
  }

  // Step 6: Delete the old resume file from cloudinary
  await deleteFromCloudinary(oldResume.resume);

  // Step 7: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Resume updated successfully"));
});

const deleteResume = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Find the user's portfolio and update the resume field
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Save the old resume URL before updating with an empty string to delete the file from cloudinary
  const oldResume = await Portfolio.findOne({ owner: userID });
  portfolio.resume = "";
  await portfolio.save({ validateBeforeSave: false });

  // Step 3: Delete the existing resume file from cloudinary
  await deleteFromCloudinary(oldResume.resume);

  // Step 4: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume deleted successfully"));
});

const addSkills = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;

  // Step 2: Retrieve data from the request body
  const { constructionOfSkill, nameOfSkill, levelOfSkill } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [constructionOfSkill, nameOfSkill, levelOfSkill].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Find the user's portfolio based on their ID
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(
      404,
      `${req.user?.fullName}, please first create your portfolio`
    );
  }

  // Todo: can not add the duplicate skills
  const isDuplicateSkill = portfolio.skills.some(
    (skill) => skill.nameOfSkill.trim() === nameOfSkill.trim()
  );
  if (isDuplicateSkill) {
    throw new ApiError(409, `${nameOfSkill} allready added`);
  }

  // Step 5: Add the new skill to the portfolio
  portfolio.skills.push({
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

const updateSkillById = asyncHandler(async (req, res) => {
  // Step 1: Get a skillID from params
  const { skillID } = req.params;

  // Step 2: Retrieve data from the request body
  const { newConstructionOfSkill, newNameOfSkill, newLevelOfSkill } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [newConstructionOfSkill, newNameOfSkill, newLevelOfSkill].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Find the user's portfolio based on their ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(
      404,
      `${req.user?.fullName}, please first create your portfolio`
    );
  }

  // Step 5: Find the index of the skill based on their ID
  const skillIndex = portfolio.skills.findIndex((skill) => {
    return skill._id.toString() === skillID;
  });

  // Todo: can not add the duplicate skills
  // Check duplicate skill when newNameOfSkill is different from nameOfSkill
  if (
    skillIndex != -1 &&
    newNameOfSkill !== portfolio.skills[skillIndex].nameOfSkill
  ) {
    const isDuplicateSkill = portfolio.skills.some(
      (skill) => skill.nameOfSkill.trim() === newNameOfSkill.trim()
    );
    if (isDuplicateSkill) {
      throw new ApiError(409, `${newNameOfSkill} allready added`);
    }
  }

  // Step 6: Update the skill if found
  if (skillIndex !== -1) {
    portfolio.skills[skillIndex].constructionOfSkill = newConstructionOfSkill;
    portfolio.skills[skillIndex].nameOfSkill = newNameOfSkill;
    portfolio.skills[skillIndex].levelOfSkill = newLevelOfSkill;
    await portfolio.save({ validateBeforeSave: false });
  } else {
    throw new ApiError(404, "Skill not found in portfolio");
  }

  // Step 7: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Skill updated successfully"));
});

const deleteSkillById = asyncHandler(async (req, res) => {
  // Step 1: Get a skillID from params
  const { skillID } = req.params;

  // Step 2: Find the user's portfolio based on their ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(
      404,
      `${req.user?.fullName}, please first create your portfolio`
    );
  }

  const lengthOfSkillsBeforeDeleting = portfolio.skills.length;

  // Step 3: Filter out the skill to delete from the skills array
  portfolio.skills = portfolio.skills.filter(
    (skill) => skill._id.toString() !== skillID
  );

  const lengthOfSkillsAfterDeleting = portfolio.skills.length;
  if (lengthOfSkillsBeforeDeleting === lengthOfSkillsAfterDeleting) {
    throw new ApiError(404, "Skill does not exist");
  }

  // Step 4: Save the updated project
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return the response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Skill deleted successfully"));
});

// Level 2: AboutMe
const createAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { content, tagline, gender } = req.body;

  // Step 3: Validation for not empty fields
  if (content.trim() === "") {
    throw new ApiError(400, "Please write about yourself in short");
  }

  // Step 4: Upload the profile image from local server to cloudinary
  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload an image file");
  }

  const profileImageLocalPath = req.file?.path;

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);
  if (!profileImage.url) {
    throw new ApiError(400, "Error while uploading the profile image");
  }

  // Step 5: Check if aboutMe already exists
  let aboutMe;
  if (!portfolio.aboutMe) {
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

    // Join aboutMe to the user's portfolio
    portfolio.aboutMe = aboutMe._id;
    await portfolio.save();
  } else {
    await deleteFromCloudinary(profileImage?.url);
    throw new ApiError(409, "About me is already created");
  }

  // Step 7: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "About me added successfully"));
});

const addHobbiesInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { hobby } = req.body;

  // Step 3: Validation for not empty fields
  if (!hobby || hobby.trim() === "") {
    throw new ApiError(400, "Hobby field is required");
  }

  // Step 4: Update aboutMe via hobbies
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

  // Step 5: Add the new hobby to aboutMe
  aboutMe.hobbies.push({ hobby });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 6: Return the response to the user
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

  // Step 3: Validation for not empty fields
  if ([platform, url].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Update aboutMe via social links
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

  // Step 5: Add the new platform to aboutMe
  aboutMe.socialLinks.push({ platform, url });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 6: Return the response to the user
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

  // Step 3: Validation for not empty fields
  if (
    [company, position, startTime, responsibilities].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Update aboutMe via work experience
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Step 5: Add the new work experience to aboutMe
  aboutMe.workExperience.push({
    company,
    position,
    startTime,
    endTime: endTime || "working",
    responsibilities,
  });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 6: Return the response to the user
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

  // Step 3: Validation for not empty fields
  if (
    [institution, degree, fieldOfStudy, graduationYear].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Update aboutMe via education
  const aboutMeID = portfolio?.aboutMe;
  if (aboutMeID === undefined) {
    throw new Error("User's about me information not found in portfolio");
  }

  const aboutMe = await AboutMe.findById(aboutMeID);

  // Todo: cannot add duplicate degree
  const isDuplicateDegree = aboutMe.education.some(
    (existingDegree) =>
      existingDegree &&
      existingDegree.degree &&
      existingDegree.degree.trim() === degree.trim()
  );
  if (isDuplicateDegree) {
    throw new ApiError(409, `${degree} already added`);
  }

  // Step 5: Add the new education to aboutMe
  aboutMe.education.push({ institution, degree, fieldOfStudy, graduationYear });
  await aboutMe.save({ validateBeforeSave: false });

  // Step 6: Return the response to the user
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

  // Step 3: Validation for not empty fields
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

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "About me details updated successfully"));
});

const updateProfileImageInAboutMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Get the local path of the new profile image file
  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload an image file");
  }

  const newProfileImageLocalPath = req.file?.path;

  // Step 3: Upload profile image file from local disk to Cloudinary
  const profileImage = await uploadOnCloudinary(newProfileImageLocalPath);
  if (!profileImage.url) {
    throw new ApiError(400, "Error while updating the profile image");
  }

  // Step 4: Find the user's portfolio aboutMe based on their ID
  const aboutMeID = portfolio.aboutMe.toString();
  const aboutMe = await AboutMe.findOne({ _id: aboutMeID });

  // Save old file URL before updating with the new file to delete the file from Cloudinary
  const oldProfileImage = await AboutMe.findOne({ _id: aboutMeID });

  // Update the portfolio with the profileImage field
  aboutMe.profileImage = profileImage.url;
  await aboutMe.save({ validateBeforeSave: false });

  // Step 5: Delete old profileImage file from Cloudinary
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

  // Step 2: Find the user's portfolio aboutMe based on their ID
  const aboutMeID = portfolio.aboutMe.toString();
  const aboutMe = await AboutMe.findOne({ _id: aboutMeID });

  // Save old file URL before updating with profileImage = "" to delete the file from Cloudinary
  const oldProfileImage = await AboutMe.findOne({ _id: aboutMeID });

  // Step 3: Update profileImage field to delete the profile image
  aboutMe.profileImage = "";
  await aboutMe.save({ validateBeforeSave: false });

  // Step 4: Delete existing profile image file from Cloudinary
  await deleteFromCloudinary(oldProfileImage.profileImage);

  // Step 5: Return response to the user
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

  // Step 4: Find the aboutMe document and update the social link
  const aboutMeID = portfolio.aboutMe;
  const aboutMe = await AboutMe.findById(aboutMeID);

  // Find the index of the social link with the given ID
  const socialLinkIndex = aboutMe.socialLinks.findIndex(
    (socialLink) => socialLink._id.toString() === socialLinkId
  );

  if (socialLinkIndex === -1) {
    throw new ApiError(404, `${newPlatform}, social platform not found`);
  }

  // Update the social link at the found index
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

  // Find the index of the work experience with the given ID
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

// Level 3: Projects
const addProject = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { title, description, githubLink, liveLink, startTime, endTime } =
    req.body;

  // Step 3: Validation for not empty fields
  if (
    [title, description, githubLink, startTime].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Todo: Parse startTime to Date type
  const [day, month, year] = startTime.split("-").map(Number);
  const parsedStartTime = new Date(year, month - 1, day);

  // Step 4: Create the project object in the database
  const project = await Project.create({
    title,
    description,
    githubLink,
    liveLink: liveLink || "",
    startTime: parsedStartTime,
    endTime: endTime || "completed",
  });

  if (!project) {
    throw new ApiError(500, "Something went wrong while adding project");
  }

  // Join project to the user's portfolio
  portfolio.projects.push(project._id);
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, project, ` ${title} project created successfully`)
    );
});

const updateProjectById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Retrieve data from the request body
  const { title, description, githubLink, liveLink, startTime, endTime } =
    req.body;

  // Step 3: Validation for not empty fields
  if (
    [title, description, githubLink, startTime].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Todo: Parse startTime to Date type
  const [day, month, year] = startTime.split("-").map(Number);
  const parsedStartTime = new Date(year, month - 1, day);

  // Step 4: Get the existing project to update the specific fields
  const project = await Project.findByIdAndUpdate(
    projectID,
    {
      $set: {
        title,
        description,
        githubLink,
        liveLink: liveLink || "",
        startTime: parsedStartTime,
        endTime: endTime || "completed",
      },
    },
    { new: true }
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, `${title} project updated successfully`));
});

const getProjectById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Find project from the database
  const project = await Project.findById(projectID);
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const deleteProjectById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Delete the project from the database
  const deletedProject = await Project.findByIdAndDelete(projectID);

  // Check if the project was found and deleted
  if (!deletedProject) {
    throw new ApiError(404, "Project not found");
  }

  // Step 3: Find the portfolio to delete the deleted project id from it
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Step 4: Filter out the project to delete from the portfolio's project array
  portfolio.projects = portfolio.projects.filter(
    (project) => project._id.toString() !== projectID
  );

  // Step 5: Save the updated project and portfolio
  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

const addProjectTechStackById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Retrieve data from the request body
  const { techStack } = req.body;

  // Step 3: Validation for not empty fields
  if (!techStack) {
    throw new ApiError(400, "Tech stack field is required");
  }

  // Step 4: Find the project based on its ID
  const project = await Project.findById(projectID);
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Todo: Cannot add the duplicate techStack
  const isDuplicateTechStack = project.techStacks.some(
    (field) => field.techStack.trim() === techStack.trim()
  );
  if (isDuplicateTechStack) {
    throw new ApiError(409, `${techStack} allready added`);
  }

  // Step 5: Add the new techStack to the project
  project.techStacks.push({
    techStack,
  });

  await project.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, `${techStack} added successfully`));
});

const updateProjectTechStackById = asyncHandler(async (req, res) => {
  // Step 1: Get the techStack's ID from params
  const { techID } = req.params;

  // Step 2: Retrieve data from the request body
  const { newTechStack } = req.body;

  // Step 3: Validation for not empty fields
  if (!newTechStack) {
    throw new ApiError(400, "New tech stack field is required");
  }

  // Step 4: Find the project containing the specified tech stack
  const project = await Project.findOne({ "techStacks._id": techID });

  if (!project) {
    throw new ApiError(404, "Project or tech stack not found");
  }

  // Step 5: Find the index of the tech stack to update
  const techStackIndex = project.techStacks.findIndex((stack) => {
    return stack._id.toString() === techID;
  });

  // Step 6: Update the tech stack if found
  if (techStackIndex !== -1) {
    project.techStacks[techStackIndex].techStack = newTechStack;
    await project.save({ validateBeforeSave: false });
  } else {
    throw new ApiError(404, "Tech Stack not found in Project");
  }

  // Step 7: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, `${newTechStack} updated successfully`));
});

const deleteProjectTechStackById = asyncHandler(async (req, res) => {
  // Step 1: Get the techStack's ID from params
  const { techID } = req.params;

  // Step 2: Find the project containing the specified tech stack
  const project = await Project.findOne({ "techStacks._id": techID });

  if (!project) {
    throw new ApiError(404, "Project or tech stack not found");
  }

  // Step 3: Filter out the tech stack to delete from the techStacks array
  project.techStacks = project.techStacks.filter(
    (stack) => stack._id.toString() !== techID
  );

  // Step 4: Save the updated project
  await project.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, `Tech stack deleted successfully`));
});

const uploadProjectImagesById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Check if images are uploaded on the server
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "No image files uploaded");
  }

  req.files.forEach((file) => {
    if (!file.mimetype.startsWith("image/")) {
      // Remove uploaded file from local disk
      fs.unlinkSync(file.path);
      throw new ApiError(400, "Please upload only image files");
    }
  });

  const cloudinaryImagesURLArray = [];
  if (req.files && req.files.length <= 2) {
    // We want to upload only two images on the local server
    for (let i = 0; i < req.files.length; i++) {
      let localPathOfImage = req.files[i]?.path;
      const cloudinaryImages = await uploadOnCloudinary(localPathOfImage);
      // Create the images URL array
      cloudinaryImagesURLArray.push(cloudinaryImages?.url);
    }
  } else {
    // If the user tries to upload more than 2 images
    // We need to take two actions
    // Action 1: remove all images from our local server
    for (let i = 0; i < req.files.length; i++) {
      fs.unlinkSync(req.files[i].path);
    }
    // Action 2: throw an error message to the user
    throw new ApiError(400, "Maximum of two images are allowed");
  }

  // Step 3: Set cloudinary images to the DB
  const project = await Project.findById(projectID);
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  for (let i = 0; i < cloudinaryImagesURLArray.length; i++) {
    // Set cloudinary images URL to DB when the images field is empty
    if (project?.images.length >= 0 && project?.images.length < 2) {
      project.images.push({ image: cloudinaryImagesURLArray[i] });
    } else {
      // If a project in the DB already contains two images
      // We need to take two actions
      // Action 1: remove images from Cloudinary
      for (let i = 0; i < 2; i++) {
        await deleteFromCloudinary(cloudinaryImagesURLArray[i]);
      }
      // Action 2: return an error message to the user
      throw new ApiError(422, "Only two images allowed per project");
    }
  }
  await project.save({ validateBeforeSave: false });

  // Step 4: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Images uploaded successfully"));
});

const updateProjectImageById = asyncHandler(async (req, res) => {
  // Step 1: Get the imageID from params (It's a MongoDB ID)
  const { imageID } = req.params;

  // Step 2: Check if image is uploaded on the server
  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload an image file");
  }

  // Step 3: Upload new image file from local disk to Cloudinary
  const newImage = await uploadOnCloudinary(req.file.path);
  if (!newImage || !newImage.url) {
    throw new ApiError(400, "Error while updating new image");
  }

  // Step 4: Find the project based on imageID
  const project = await Project.findOne({ "images._id": imageID });
  if (!project) {
    throw new ApiError(404, "Project does not exit");
  }

  // Step 5: Save old file URL before updating with new file to delete the file from Cloudinary
  const oldProjectImage = await Project.findOne({ "images._id": imageID });

  // Step 6: Find the index of the given imageID
  const oldImageIndex = project.images.findIndex(
    (image) => image._id.toString() === imageID
  );

  if (oldImageIndex === -1) {
    throw new ApiError(404, "Old image not found");
  }

  // Step 7: Update the project with newImage
  project.images[oldImageIndex].image = newImage?.url;
  await project.save({ validateBeforeSave: false });

  // Step 8: Delete old image file from Cloudinary
  await deleteFromCloudinary(oldProjectImage.images[oldImageIndex].image);

  // Step 9: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Image updated successfully"));
});

const deleteProjectImageById = asyncHandler(async (req, res) => {
  // Step 1: Get the imageID from params (It's a MongoDB ID)
  const { imageID } = req.params;

  // Step 2: Find the project based on imageID
  const project = await Project.findOne({ "images._id": imageID });
  if (!project) {
    throw new ApiError(404, "Project does not exit");
  }

  // Step 3: Save old file URL before deleting old file in DB to delete the file from Cloudinary
  const oldProjectImage = await Project.findOne({ "images._id": imageID });

  // Step 4: Find the index of the given imageID
  const oldImageIndex = project.images.findIndex(
    (image) => image._id.toString() === imageID
  );

  if (oldImageIndex === -1) {
    throw new ApiError(404, "Old image not found");
  }

  // Step 5: Remove the old image from the images array in the project document
  project.images.splice(oldImageIndex, 1);

  // Step 6: Save the updated project document
  await project.save({ validateBeforeSave: false });

  // Step 7: Delete old image file from Cloudinary
  await deleteFromCloudinary(oldProjectImage.images[oldImageIndex].image);

  // Step 8: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Image deleted successfully"));
});

const uploadProjectVideoById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  /*
   Todo: We want to upload only one video with these conditions
   * Condition 1: video size in MB is at most 10MB
   * Condition 2: video duration is at most 3 minutes
  */

  // Step 2: Check if a file is uploaded to local server and it's a video
  if (!req.file || !req.file?.mimetype.startsWith("video/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a video file");
  }

  // Step 3: Get the duration of the uploaded video and validate it
  const videoPath = req.file?.path;
  const isNotValidDuration = await validateVideoDuration(videoPath);

  if (isNotValidDuration) {
    // Remove uploaded video file from local disk
    fs.unlinkSync(req.file?.path);
    throw new ApiError(400, `Video duration should be at most 3 minutes`);
  }

  // Step 4: Find the project based on projectID
  const project = await Project.findById(projectID);
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Step 5: Update the video field with cloudinary video URL when video field is undefined
  if (project?.video === undefined) {
    // Action 1: Upload the video from local server to cloudinary
    const cloudinaryVideo = await uploadOnCloudinary(videoPath);
    if (!cloudinaryVideo?.url) {
      throw new ApiError(400, "Error while uploading the video");
    }
    // Action 2: Update the video field of project with cloudinary video URL
    project.video = cloudinaryVideo?.url;
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete video from local disk
    fs.unlinkSync(videoPath);
    // Action 2: Throw error message when video is already uploaded
    throw new ApiError(400, "Maximum of 1 video is allowed");
  }

  // Step 6: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Video uploaded successfully"));
});

const updateProjectVideoById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Check if a file is uploaded to local server and it's a video
  if (!req.file || !req.file?.mimetype.startsWith("video/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a video file");
  }

  // Step 3: Get the duration of the uploaded video and validate it
  const videoPath = req.file.path;
  const isNotValidDuration = await validateVideoDuration(videoPath);

  if (isNotValidDuration) {
    // Remove uploaded video file from local disk
    fs.unlinkSync(videoPath);
    throw new ApiError(400, "Video duration should be at most 3 minutes");
  }

  // Step 4: Find the project based on project's ID
  const project = await Project.findOne({ _id: projectID });
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // step 5: Save old file URL before updating with new file to delete the file from Cloudinary
  const oldProjectVideoUrl = await Project.findOne({ _id: projectID });

  // Step 6: Update the video field with new cloudinary video URL when video field is not undefined
  if (project.video) {
    // Action 1: Upload the new video from local server to cloudinary
    const cloudinaryVideo = await uploadOnCloudinary(videoPath);
    if (!cloudinaryVideo?.url) {
      throw new ApiError(400, "Error while uploading the video");
    }
    // Action 2: Update the video field of project with new cloudinary video URL
    project.video = cloudinaryVideo.url;
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete video from local disk
    fs.unlinkSync(videoPath);
    // Action 2: Throw error message when video is not uploaded
    throw new ApiError(400, "First upload the project video");
  }

  // Step 7: Delete old video from cloudinary
  await deleteVideoFromCloudinary(oldProjectVideoUrl.video);

  // Step 8: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video updated successfully"));
});

const deleteProjectVideoById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Find the project based on project's ID
  const project = await Project.findOne({ _id: projectID });
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Step 3: delete the video file when video field is not undefined
  if (project?.video) {
    // Action 1: Delete old video from cloudinary
    await deleteVideoFromCloudinary(project.video);

    // Action 2: Update the video field of project with ""
    project.video = "";
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Throw error message when video is not uploaded
    throw new ApiError(400, "First upload the project video");
  }

  // Step 4: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const uploadProjectDocumentationPDFById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Check if a file is uploaded to local server and it's a PDF
  if (!req.file || !req.file?.mimetype.startsWith("application/pdf")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a PDF file");
  }

  // Step 3: Find the project based on projectID
  const project = await Project.findById(projectID);
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Step 4: Update the documentationPDF field with cloudinary PDF URL when documentationPDF field is undefined
  if (!project?.documentationPDF) {
    // Action 1: Upload the PDF from local server to cloudinary
    const cloudinaryPDF = await uploadOnCloudinary(req.file?.path);
    if (!cloudinaryPDF?.url) {
      throw new ApiError(400, "Error while uploading the PDF");
    }
    // Action 2: Update the documentationPDF field of project with cloudinary PDF URL
    project.documentationPDF = cloudinaryPDF?.url;
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete PDF from local disk
    fs.unlinkSync(req.file?.path);
    // Action 2: Throw error message when PDF is already uploaded
    throw new ApiError(400, "Maximum of 1 PDF is allowed");
  }

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "PDF uploaded successfully"));
});

const updateProjectDocumentationPDFById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Check if a file is uploaded to local server and it's a PDF
  if (!req.file || !req.file?.mimetype.startsWith("application/pdf")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a PDF file");
  }

  // Step 3: Find the project based on project's ID
  const project = await Project.findOne({ _id: projectID });
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // step 4: Save old file URL before updating with new file to delete the file from Cloudinary
  const oldProjectDocPDFUrl = await Project.findOne({ _id: projectID });

  // Step 5: Update the documentationPDF field with new cloudinary PDF URL when documentationPDF field is not undefined
  if (project.documentationPDF) {
    // Action 1: Upload the new PDF from local server to cloudinary
    const cloudinaryPDF = await uploadOnCloudinary(req.file?.path);
    if (!cloudinaryPDF?.url) {
      throw new ApiError(400, "Error while uploading the PDF");
    }
    // Action 2: Update the documentationPDF field of project with new cloudinary PDF URL
    project.documentationPDF = cloudinaryPDF.url;
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete PDF from local disk
    fs.unlinkSync(req.file?.path);
    // Action 2: Throw error message when PDF is not uploaded
    throw new ApiError(400, "First upload the project PDF");
  }

  // Step 6: Delete old PDF from cloudinary
  await deleteFromCloudinary(oldProjectDocPDFUrl.documentationPDF);

  // Step 7: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "PDF updated successfully"));
});

const deleteProjectDocumentationPDFById = asyncHandler(async (req, res) => {
  // Step 1: Get the project's ID from params
  const { projectID } = req.params;

  // Step 2: Find the project based on project's ID
  const project = await Project.findOne({ _id: projectID });
  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  // Step 3: delete the PDF file when documentationPDF field is not undefined
  if (project?.documentationPDF) {
    // Action 1: Delete old PDF from cloudinary
    await deleteFromCloudinary(project.documentationPDF);

    // Action 2: Update the documentationPDF field of project with ""
    project.documentationPDF = "";
    await project.save({ validateBeforeSave: false });
  } else {
    // Action 1: Throw error message when PDF is not uploaded
    throw new ApiError(400, "First upload the project PDF");
  }

  // Step 4: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "PDF deleted successfully"));
});

// Level 4: Articles
const createArticle = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { title, content, category } = req.body;

  // Step 3: Validation for not empty fields
  if ([title, content, category].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Create the article object in the database
  const article = await Article.create({
    title,
    content,
    category,
    createdBy: userID,
  });

  if (!article) {
    throw new ApiError(500, "Something went wrong while creating article");
  }

  // Join article to the user's portfolio
  portfolio.articles.push(article._id);
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, article, `Article created successfully`));
});

const updateArticleById = asyncHandler(async (req, res) => {
  // Step 1: Get the article's ID from params
  const { articleID } = req.params;

  // Step 2: Retrieve data from the request body
  const { newTitle, newContent, newCategory } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [newTitle, newContent, newCategory].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Step 4: Get the existing article to update the specific fields
  const article = await Article.findByIdAndUpdate(
    articleID,
    {
      $set: {
        title: newTitle,
        content: newContent,
        category: newCategory,
        publicationDate: Date.now(),
      },
    },
    { new: true }
  );

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Article updated successfully"));
});

const getArticleById = asyncHandler(async (req, res) => {
  // Step 1: Get the article's ID from params
  const { articleID } = req.params;

  // Step 2: Find article from the database
  const article = await Article.findById(articleID);
  if (!article) {
    throw new ApiError(404, "Article does not exist");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, article, "Article fetched successfully"));
});

const deleteArticleById = asyncHandler(async (req, res) => {
  // Step 1: Get the article's ID from params
  const { articleID } = req.params;

  // Step 2: Delete the article from the database
  const deletedArticle = await Article.findByIdAndDelete(articleID);

  // Check if the article was found and deleted
  if (!deletedArticle) {
    throw new ApiError(404, "Article not found");
  }

  // Step 3: Find the portfolio to delete the deleted article id from it
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Step 4: Filter out the article to delete from the portfolio's article array
  portfolio.articles = portfolio.articles.filter(
    (article) => article._id.toString() !== articleID
  );

  // Step 5: Save the updated article and portfolio
  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Article deleted successfully"));
});

// Level 5: Certificates
const addCertificateDetails = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { title, description, issuer, issuanceDate, url } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [title, issuer, issuanceDate, url].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Todo: Parse issuanceDate to Date type
  const [day, month, year] = issuanceDate.split("-").map(Number);
  const parsedIssuanceDate = new Date(year, month - 1, day);

  // Step 4: Create the certificate object in the database
  const certificate = await Certificate.create({
    title,
    issuer,
    issuanceDate: parsedIssuanceDate,
    url,
    description: description || "",
  });

  if (!certificate) {
    throw new ApiError(500, "Something went wrong while creating certificate");
  }

  // Join certificate to the user's portfolio
  portfolio.certificates.push(certificate._id);
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, certificate, `Certificate created successfully`)
    );
});

const updateCertificateDetailsById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Retrieve data from the request body
  const { newTitle, newDescription, newIssuer, newIssuanceDate, newUrl } =
    req.body;

  // Step 3: Validation for not empty fields
  if (
    [newTitle, newIssuer, newIssuanceDate, newUrl].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Todo: Parse newIssuanceDate to Date type
  const [day, month, year] = newIssuanceDate.split("-").map(Number);
  const parsedNewIssuanceDate = new Date(year, month - 1, day);

  // Step 4: Get the existing certificate to update the specific fields
  const certificate = await Certificate.findByIdAndUpdate(
    certificateID,
    {
      $set: {
        title: newTitle,
        description: newDescription || "",
        issuer: newIssuer,
        issuanceDate: parsedNewIssuanceDate,
        url: newUrl,
      },
    },
    { new: true }
  );

  if (!certificate) {
    throw new ApiError(404, "Certificate not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate updated successfully"));
});

const getCertificateById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Find certificate from the database
  const certificate = await Certificate.findById(certificateID);
  if (!certificate) {
    throw new ApiError(404, "Certificate does not exist");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(200, certificate, "Certificate fetched successfully")
    );
});

const deleteCertificateById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Delete the certificate from the database
  const deletedCertificate = await Certificate.findByIdAndDelete(certificateID);

  // Check if the certificate was found and deleted
  if (!deletedCertificate) {
    throw new ApiError(404, "Certificate not found");
  }

  // Step 3: Find the portfolio to delete the deleted certificate id from it
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Step 4: Filter out the certificate to delete from the portfolio's certificate array
  portfolio.certificates = portfolio.certificates.filter(
    (certificate) => certificate._id.toString() !== certificateID
  );

  // Step 5: Save the updated certificate and portfolio
  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate deleted successfully"));
});

const uploadCertificateImageById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Check if a file is uploaded to local server and it's a Image
  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a image file");
  }

  const certificateImageLocalPath = req.file?.path;

  // Step 3: Find certificate from the database
  const certificate = await Certificate.findById(certificateID);
  if (!certificate) {
    throw new ApiError(404, "Certificate does not exist");
  }

  // Step 4: Upload certificate image when image filed is undefined
  if (!certificate?.image) {
    // ACTION 1: Upload the image file from the local disk to cloudinary
    const cloudinaryCertificate = await uploadOnCloudinary(
      certificateImageLocalPath
    );
    if (!cloudinaryCertificate?.url) {
      throw new ApiError(400, "Error while uploading the image");
    }

    // Action 2: Update the image field via cloudinary certificate URL
    certificate.image = cloudinaryCertificate.url;
    await certificate.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete the file from local disk
    fs.unlinkSync(certificateImageLocalPath);

    // Action 2: Throw an error to the user
    throw new ApiError(400, "Maximum of 1 certificate image is allowed");
  }

  // Step 6: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Certificate image uploaded successfully"));
});

const updateCertificateImageById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Check if a file is uploaded to local server and it's a Image
  if (!req.file || !req.file?.mimetype.startsWith("image/")) {
    if (req.file?.path != undefined) {
      // Remove uploaded file from local disk
      fs.unlinkSync(req.file?.path);
    }
    throw new ApiError(400, "Please upload a image file");
  }

  const certificateImageLocalPath = req.file?.path;

  // Step 3: Find certificate from the database
  const certificate = await Certificate.findById(certificateID);
  if (!certificate) {
    throw new ApiError(404, "Certificate does not exist");
  }

  // Step 4: Update certificate image when image filed is not undefined

  // Save the old certificate image URL before updating with the new file to delete the file from cloudinary
  const oldCertificate = await Certificate.findById(certificateID);

  if (certificate?.image) {
    // ACTION 1: Upload the image file from the local disk to cloudinary
    const cloudinaryCertificate = await uploadOnCloudinary(
      certificateImageLocalPath
    );
    if (!cloudinaryCertificate?.url) {
      throw new ApiError(400, "Error while uploading the image");
    }

    // Action 2: Update the image field via cloudinary certificate URL
    certificate.image = cloudinaryCertificate.url;
    await certificate.save({ validateBeforeSave: false });
  } else {
    // Action 1: Delete the file from local disk
    fs.unlinkSync(certificateImageLocalPath);

    // Action 2: Throw an error to the user
    throw new ApiError(400, "First upload certificate image");
  }

  // Step 6: Delete the old certificate image file from cloudinary
  await deleteFromCloudinary(oldCertificate.image);

  // Step 7: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate image updated successfully"));
});

const deleteCertificateImageById = asyncHandler(async (req, res) => {
  // Step 1: Get the certificate's ID from params
  const { certificateID } = req.params;

  // Step 2: Find certificate from the database
  const certificate = await Certificate.findById(certificateID);
  if (!certificate) {
    throw new ApiError(404, "Certificate does not exist");
  }

  // Step 3: delete the image file when image field is not undefined
  if (certificate?.image) {
    // Action 1: Delete old image from cloudinary
    await deleteFromCloudinary(certificate.image);

    // Action 2: Update the image field of certificate with ""
    certificate.image = "";
    await certificate.save({ validateBeforeSave: false });
  } else {
    // Action 1: Throw error message to user
    throw new ApiError(400, "First upload the certificate image");
  }

  // Step 4: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Certificate image deleted successfully"));
});

// Level 6: Achievements
const addAchievement = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { title, description, type, issuanceDate } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [title, description, type, issuanceDate].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Todo: Parse issuanceDate to Date type
  const [day, month, year] = issuanceDate.split("-").map(Number);
  const parsedIssuanceDate = new Date(year, month - 1, day);

  // Step 4: Create the achievement object in the database
  const achievement = await Achievement.create({
    title,
    description,
    type,
    issuanceDate: parsedIssuanceDate,
  });

  if (!achievement) {
    throw new ApiError(500, "Something went wrong while adding achievement");
  }

  // Join achievement to the user's portfolio
  portfolio.achievements.push(achievement._id);
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, achievement, `Achievement created successfully`)
    );
});

const updateAchievementById = asyncHandler(async (req, res) => {
  // Step 1: Get the achievement's ID from params
  const { achievementID } = req.params;

  // Step 2: Retrieve data from the request body
  const { newTitle, newDescription, newType, newIssuanceDate } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [newTitle, newDescription, newType, newIssuanceDate].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Todo: Parse newIssuanceDate to Date type
  const [day, month, year] = newIssuanceDate.split("-").map(Number);
  const parsedNewIssuanceDate = new Date(year, month - 1, day);

  // Step 4: Get the existing achievement to update the specific fields
  const achievement = await Achievement.findByIdAndUpdate(
    achievementID,
    {
      $set: {
        title: newTitle,
        description: newDescription,
        type: newType,
        issuanceDate: parsedNewIssuanceDate,
      },
    },
    { new: true }
  );

  if (!achievement) {
    throw new ApiError(404, "Achievement not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Achievement updated successfully"));
});

const getAchievementById = asyncHandler(async (req, res) => {
  // Step 1: Get the achievement's ID from params
  const { achievementID } = req.params;

  // Step 2: Find achievement from the database
  const achievement = await Achievement.findById(achievementID);
  if (!achievement) {
    throw new ApiError(404, "Achievement does not exist");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(200, achievement, "Achievement fetched successfully")
    );
});

const deleteAchievementById = asyncHandler(async (req, res) => {
  // Step 1: Get the achievement's ID from params
  const { achievementID } = req.params;

  // Step 2: Delete the achievement from the database
  const deletedAchievement = await Achievement.findByIdAndDelete(achievementID);

  // Check if the achievement was found and deleted
  if (!deletedAchievement) {
    throw new ApiError(404, "Achievement not found");
  }

  // Step 3: Find the portfolio to delete the deleted achievement id from it
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Step 4: Filter out the achievement to delete from the portfolio's achievement array
  portfolio.achievements = portfolio.achievements.filter(
    (achievement) => achievement._id.toString() !== achievementID
  );

  // Step 5: Save the updated achievement and portfolio
  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Achievement deleted successfully"));
});

// Level 7: Testimonials
const addTestimonial = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { content, name, organization, rating, linkedinURL, twitterURL } =
    req.body;

  // Step 3: Validation for not empty fields
  if ([content, name, organization].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Create the testimonial object in the database
  const testimonial = await Testimonial.create({
    content,
    name,
    organization,
    rating: rating || 0,
    linkedinURL: linkedinURL || "",
    twitterURL: twitterURL || "",
  });

  if (!testimonial) {
    throw new ApiError(500, "Something went wrong while adding testimonial");
  }

  // Join testimonial to the user's portfolio
  portfolio.testimonials.push(testimonial._id);
  await portfolio.save({ validateBeforeSave: false });

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(
      new ApiResponse(201, testimonial, `Testimonial created successfully`)
    );
});

const updateTestimonialById = asyncHandler(async (req, res) => {
  // Step 1: Get the testimonial's ID from params
  const { testimonialID } = req.params;

  // Step 2: Retrieve data from the request body
  const {
    newContent,
    newName,
    newOrganization,
    newRating,
    newLinkedinURL,
    newTwitterURL,
  } = req.body;

  // Step 3: Validation for not empty fields
  if (
    [newContent, newName, newOrganization].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Get the existing testimonial to update the specific fields
  const testimonial = await Testimonial.findByIdAndUpdate(
    testimonialID,
    {
      $set: {
        content: newContent,
        name: newName,
        organization: newOrganization,
        rating: newRating || 0,
        linkedinURL: newLinkedinURL || "",
        twitterURL: newTwitterURL || "",
      },
    },
    { new: true }
  );

  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Testimonial updated successfully"));
});

const getTestimonialById = asyncHandler(async (req, res) => {
  // Step 1: Get the testimonial's ID from params
  const { testimonialID } = req.params;

  // Step 2: Find testimonial from the database
  const testimonial = await Testimonial.findById(testimonialID);
  if (!testimonial) {
    throw new ApiError(404, "Testimonial does not exist");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(
      new ApiResponse(200, testimonial, "Testimonial fetched successfully")
    );
});

const deleteTestimonialById = asyncHandler(async (req, res) => {
  // Step 1: Get the testimonial's ID from params
  const { testimonialID } = req.params;

  // Step 2: Delete the testimonial from the database
  const deletedTestimonial = await Testimonial.findByIdAndDelete(testimonialID);

  // Check if the testimonial was found and deleted
  if (!deletedTestimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  // Step 3: Find the portfolio to delete the deleted testimonial from it
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });
  if (!portfolio) {
    throw new ApiError(404, "Portfolio does not exist");
  }

  // Step 4: Filter out the testimonial to delete from the portfolio's testimonial array
  portfolio.testimonials = portfolio.testimonials.filter(
    (testimonial) => testimonial._id.toString() !== testimonialID
  );

  // Step 5: Save the updated testimonial and portfolio
  await portfolio.save({ validateBeforeSave: false });

  // Step 6: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Testimonial deleted successfully"));
});

// Level 8: ContactMe
const addContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { email, phone, city, state, country } = req.body;

  // Step 3: Validation for not empty fields
  if ([email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Check if contactMe already exists
  let contactMe;
  if (!portfolio?.contactMe) {
    const addressObj = {
      city: city || "",
      state: state || "",
      country: country || "",
    };

    // Create contactMe document first time
    contactMe = await ContactMe.create({
      email,
      phone: phone || null,
      address: addressObj,
    });

    if (!contactMe) {
      throw new ApiError(500, "Something went wrong while adding contact me");
    }

    // Join contactMe to the user's portfolio
    portfolio.contactMe = contactMe._id;
    await portfolio.save();
  } else {
    throw new ApiError(409, "Contact me is already created");
  }

  // Step 5: Return response to the user
  return res
    .status(201)
    .json(new ApiResponse(201, contactMe, "Contact me added successfully"));
});

const updateContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { newEmail, newPhone, newCity, newState, newCountry } = req.body;

  // Step 3: Validation for not empty fields
  if ([newEmail].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Check if contactMe already exists then update it
  let contactMe;
  if (portfolio?.contactMe) {
    const addressObj = {
      city: newCity || "",
      state: newState || "",
      country: newCountry || "",
    };

    // Update old contactMe document
    const contactMeID = portfolio.contactMe;
    contactMe = await ContactMe.findByIdAndUpdate(
      contactMeID,
      {
        $set: {
          email: newEmail,
          phone: newPhone || null,
          address: addressObj,
        },
      },
      { new: true }
    );

    if (!contactMe) {
      throw new ApiError(500, "Something went wrong while updating contact me");
    }
  } else {
    throw new ApiError(409, "Contact me does not found");
  }

  // Step 5: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, contactMe, "Contact me updated successfully"));
});

const deleteContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Check if contactMe already exists then delete it
  let contactMe;
  if (portfolio?.contactMe) {
    // Delete old contactMe document
    const contactMeID = portfolio.contactMe;
    contactMe = await ContactMe.findByIdAndDelete(contactMeID);

    if (!contactMe) {
      throw new ApiError(500, "Something went wrong while deleting contact me");
    }

    portfolio.contactMe = null;
    portfolio.save({ validateBeforeSave: false });
  } else {
    throw new ApiError(409, "Contact me does not found");
  }

  // Step 3: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Contact me deleted successfully"));
});

const addSocialLinkInContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body
  const { platform, url } = req.body;

  // Step 3: Validation for not empty fields
  if ([platform, url].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Fetch the contactMe document using the stored ID
  const contactMeID = portfolio.contactMe;
  let contactMe = await ContactMe.findById(contactMeID);

  if (!contactMe) {
    throw new ApiError(409, "Contact me does not exist");
  }

  // Step 5: Check if the social link platform is unique
  const existingSocialLink = contactMe.socialLinks.find(
    (link) => link.platform === platform
  );
  if (existingSocialLink) {
    throw new ApiError(409, `${platform} already exists in social links`);
  }

  // Step 6: Update contactMe with the new socialLink
  contactMe.socialLinks.push({ platform, url });
  await contactMe.save();

  // Step 7: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, contactMe, `${platform} added successfully`));
});

const updateSocialLinkByIdInContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve data from the request body and parameters
  const { newPlatform, newUrl } = req.body;
  const { socialLinkID } = req.params;

  // Step 3: Validation for not empty fields
  if ([newPlatform, newUrl].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields");
  }

  // Step 4: Fetch the contactMe document using the stored ID
  const contactMeID = portfolio.contactMe;
  let contactMe = await ContactMe.findById(contactMeID);

  if (!contactMe) {
    throw new ApiError(409, "Contact me does not exist");
  }

  // Step 5: Find the index of the social link to update
  const socialLinkIndex = contactMe.socialLinks.findIndex(
    (link) => link._id.toString() === socialLinkID
  );

  if (socialLinkIndex === -1) {
    throw new ApiError(404, "Social link not found");
  }

  // Step 6: Check if the new platform already exists in other social links
  const existingSocialLink = contactMe.socialLinks.find(
    (link, index) => link.platform === newPlatform && index !== socialLinkIndex
  );

  if (existingSocialLink) {
    throw new ApiError(
      409,
      "The platform already exists in another social link"
    );
  }

  // Step 7: Update the social link
  contactMe.socialLinks[socialLinkIndex].platform = newPlatform;
  contactMe.socialLinks[socialLinkIndex].url = newUrl;
  await contactMe.save();

  // Step 8: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, contactMe, "Social link updated successfully"));
});

const deleteSocialLinkByIdInContactMe = asyncHandler(async (req, res) => {
  // Step 1: Verify JWT to get the user's ID
  const userID = req.user._id;
  const portfolio = await Portfolio.findOne({ owner: userID });

  // Step 2: Retrieve social link ID from request parameters
  const { socialLinkID } = req.params;

  // Step 3: Fetch the contactMe document using the stored ID
  const contactMeID = portfolio.contactMe;
  let contactMe = await ContactMe.findById(contactMeID);

  if (!contactMe) {
    throw new ApiError(409, "Contact me does not exist");
  }

  // Step 4: Find the index of the social link to delete
  const socialLinkIndex = contactMe.socialLinks.findIndex(
    (link) => link._id.toString() === socialLinkID
  );

  if (socialLinkIndex === -1) {
    throw new ApiError(404, "Social link not found");
  }

  // Step 5: Filter out the social link with the specified ID
  contactMe.socialLinks = contactMe.socialLinks.filter(
    (link) => link._id.toString() !== socialLinkID
  );

  // Step 6: Save the updated contactMe document
  await contactMe.save();

  // Step 7: Return response to the user
  return res
    .status(200)
    .json(new ApiResponse(200, contactMe, "Social link deleted successfully"));
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
  addProject,
  updateProjectById,
  getProjectById,
  deleteProjectById,
  addProjectTechStackById,
  updateProjectTechStackById,
  deleteProjectTechStackById,
  uploadProjectImagesById,
  updateProjectImageById,
  deleteProjectImageById,
  uploadProjectVideoById,
  updateProjectVideoById,
  deleteProjectVideoById,
  uploadProjectDocumentationPDFById,
  updateProjectDocumentationPDFById,
  deleteProjectDocumentationPDFById,
  updateHomeWelcomeMessage,
  deleteHomeWelcomeMessage,
  updateSkillById,
  deleteSkillById,
  createArticle,
  updateArticleById,
  getArticleById,
  deleteArticleById,
  addCertificateDetails,
  updateCertificateDetailsById,
  getCertificateById,
  deleteCertificateById,
  uploadCertificateImageById,
  updateCertificateImageById,
  deleteCertificateImageById,
  addAchievement,
  updateAchievementById,
  getAchievementById,
  deleteAchievementById,
  addTestimonial,
  updateTestimonialById,
  getTestimonialById,
  deleteTestimonialById,
  addContactMe,
  updateContactMe,
  deleteContactMe,
  addSocialLinkInContactMe,
  updateSocialLinkByIdInContactMe,
  deleteSocialLinkByIdInContactMe,
};
