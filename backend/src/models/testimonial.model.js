import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Describe the testimonial feedback"],
    },
    name: {
      type: String,
      required: [true, "Enter testimonial name"],
    },
    organization: {
      type: String,
      required: [true, "Enter testimonial organization name"],
    },
    rating: {
      type: Number,
      default: 0,
    },
    linkedinURL: {
      type: String,
    },
    twitterURL: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
