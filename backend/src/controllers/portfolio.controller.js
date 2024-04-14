import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Portfolio } from "../models/portfolio/portfolio.model.js";

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
        portfolio,
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
      new ApiResponse(
        201,
        portfolio,
        "Home welcome message created successfully"
      )
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
    .json(
      new ApiResponse(201, portfolio.resume, "Resume uploaded successfully")
    );
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
    .json(
      new ApiResponse(201, portfolio.resume, "Resume updated successfully")
    );
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
    .json(new ApiResponse(200, portfolio, "Resume deleted successfully"));
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
    .json(new ApiResponse(201, portfolio.skill, "Skill added successfully"));
});

export {
  createPortfolio,
  createHomeWelcomeMessage,
  uploadResume,
  updateResume,
  deleteResume,
  addSkills,
};
