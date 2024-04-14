import mongoose from "mongoose";

const articlesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Enter article title"],
    },
    content: {
      type: String,
      required: [true, "Enter article content"],
    },
    categories: {
      type: String,
      enum: [
        "MERN",
        "MEAN",
        "IT",
        "Web Development",
        "Mobile Development",
        "Data Science",
        "Machine Learning",
        "Artificial Intelligence",
        "Cybersecurity",
        "DevOps",
        "Cloud Computing",
        "Software Engineering",
        "Programming Languages",
        "Database Management",
        "UI/UX Design",
        "Blockchain",
        "Networking",
        "Internet of Things (IoT)",
        "Big Data",
        "Embedded Systems",
        "Game Development",
        "AR/VR",
      ],
      required: [true, "Please enter article category"],
    },
    publicationDate: {
      type: Date,
      default: Date.now(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Article = mongoose.model("Article", articlesSchema);
