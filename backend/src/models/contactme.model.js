import mongoose from "mongoose";

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

const contactMeSchema = new mongoose.Schema(
  {
    socialLinks: [socialLinksSchema],
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: Number,
      minLength: [10, "Invalid phone number"],
    },
    address: {
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export const ContactMe = mongoose.model("ContactMe", contactMeSchema);
