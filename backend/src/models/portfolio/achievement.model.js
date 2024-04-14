import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter your achievement title"],
    },
    description: {
      type: String,
      required: [true, "Please describe your achievement"],
    },
    type: {
      type: String,
      required: [true, "Please enter your achievement field type"],
    },
    date: {
      type: Date,
      default: Date.now(),
      required: [true, "Please enter your achievement issuance date"],
    },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model("Achievement", achievementSchema);
