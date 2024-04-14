import mongoose from "mongoose";

// 📝 Skill Schema Object
const skillSchemaObject = {
  constructionOfSkill: {
    type: String,
    enum: [
      "Programming Language",
      "Frameworks & Libraries",
      "Databases",
      "Networking",
      "Security",
      "Cloud Computing",
      "Operating Systems",
      "Data Structures & Algorithms",
      "Web Development",
      "Mobile Development",
      "Machine Learning & AI",
      "DevOps",
      "Testing",
      "UI/UX Design",
    ],
    required: [true, "Please enter your skill construction"],
  },
  nameOfSkill: {
    type: String,
    required: [true, "Please enter your skill name"],
  },
  levelOfSkill: {
    type: String,
    enum: ["Proficient", "Intermediate", "Beginner", "Advanced"],
    required: [true, "Please enter your skill level"],
  },
};

const portfolioSchema = new mongoose.Schema(
  {
    aboutMe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AboutMe",
    },
    skill: [skillSchemaObject],
    articles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    home: {
      type: String,
      default: "Welcome to Console Busters",
    },
    resume: {
      type: String, // Cloudinary URL
    },
    certificates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    ],
    contactMe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactMe",
    },
    testimonials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Testimonial",
      },
    ],
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
