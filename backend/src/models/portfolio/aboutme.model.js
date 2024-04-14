import mongoose from "mongoose";

// 📝 Education schema object
const educationSchema = {
  institution: {
    type: String,
    required: [true, "Enter your institute or university name"],
  },
  degree: {
    type: String,
    required: [true, "Enter your degree"],
  },
  fieldOfStudy: {
    type: String,
    required: [true, "Enter your field of study"],
  },
  graduationYear: {
    type: Number,
    required: [true, "Enter your graduation year"],
  },
};

// 📝 Work Experience schema object
const workExperienceSchema = {
  company: {
    type: String,
    required: [true, "Enter company name"],
  },
  position: {
    type: String,
    required: [true, "Enter your position at company"],
  },
  startTime: {
    type: Date,
    required: [true, "Enter your starting time at company"],
  },
  endTime: {
    type: String,
    enum: ["full time", "part time", "internship", "working", "freelancer"],
    default: "working",
  },
  responsibilities: [
    {
      type: String,
      required: [true, "Enter your responsibilities at company"],
    },
  ],
};

// 📝 Social Links schema object
const socialLinksSchema = {
  platform: {
    type: String,
    required: [true, "Enter social media platform name"],
  },
  url: {
    type: String,
    required: [true, "Enter social media URL"],
  },
};

const aboutMeSchema = new mongoose.Schema(
  {
    education: [educationSchema],
    content: {
      type: String,
      required: [true, "Please write about yourself in short"],
    },
    hobbies: [
      {
        type: String,
        trim: true,
      },
    ],
    tagline: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // Cloudinary URL
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },
    workExperience: [workExperienceSchema],
    socialLinks: [socialLinksSchema],
  },
  { timestamps: true }
);

export const AboutMe = mongoose.model("AboutMe", aboutMeSchema);
