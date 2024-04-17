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
    techStacks: [
      {
        techStack: {
          type: String,
          required: [true, "Pleade enter used tech stacks"],
        },
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
      required: [true, "Enter your starting time of building project"],
    },
    endTime: {
      type: String,
      enum: ["processing", "completed"],
      default: "completed",
    },
    images: [
      {
        image: {
          type: String, // Cloudinary URL
        },
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
