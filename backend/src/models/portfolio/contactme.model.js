import mongoose from "mongoose";
import validator from "validator";

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
      validate: validator.isEmail,
      required: true,
    },
    phone: {
      type: Number,
      validate: {
        validator: function (v) {
          // Custom validation function to check length
          // Validates if it contains exactly 10 digits
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
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
