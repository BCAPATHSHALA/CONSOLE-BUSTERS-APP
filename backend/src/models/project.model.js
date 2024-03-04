import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter project name"],
    },
    description: {
      type: String,
      required: [true, "Please describe project"],
    },
    techStack: [
      {
        type: String,
        required: [true, "Pleade enter used tech stacks"],
      },
    ],
    githubLink: {
      type: String,
      required: [true, "Please enter project github link"],
    },
    liveLink: {
      type: String,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: String,
      enum: ["processing", "completed"],
      default: "completed",
    },
    images: [
      {
        type: String, // Cloudinary URL
      },
    ],
    video: {
      type: String, // Cloudinary URL
    },
    documentationPDF: {
      type: String, // Cloudinary URL
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
