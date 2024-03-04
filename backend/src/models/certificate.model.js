import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter your certificate title"],
    },
    description: {
      type: String,
    },
    issuer: {
      type: String,
      required: [true, "Please enter your certificate issuer"],
    },
    issuanceDate: {
      type: Date,
      default: Date.now(),
      required: [true, "Please enter your certificate issuance date"],
    },
    url: {
      type: String,
      required: [true, "Please enter your certificate URL"],
    },
    image: {
      type: String, // Cloudinary URL
    },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model("Certificate", certificateSchema);
