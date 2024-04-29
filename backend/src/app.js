import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Configure the CORS middleware to set frontendURI
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
    methods: ["POST", "PATCH", "GET", "DELETE", "PUT"],
  })
);

// Rate limiting middleware
app.use(limiter);

// Configuration of middleware for handling the different data format
// JSON data from req.body
app.use(express.json({ limit: "16kb" }));
// URL based data from req.params
app.use(express.urlencoded({ extends: true, limit: "16kb" }));
// Static file data for storing in our server folder "public"
app.use(express.static("public"));
// Cookie Data for performing the CRUD operations through our server
app.use(cookieParser());

// Import the routes
import userRouter from "./routes/user.routes.js";
import portfolioRouter from "./routes/portfolio.routes.js";

// Routes declaration middlewares
app.use("/api/v1", userRouter);
app.use("/api/v1", portfolioRouter);

// Time Scheduler 1: Automatically unblock users after 2 days
import nodeCron from "node-cron";
import { User } from "./models/auth/user.model.js";
import { unblockUser } from "./controllers/user.controller.js";

// Time schedule to run every day at midnight
nodeCron.schedule("0 0 * * * *", async () => {
  try {
    // Step 1: Find all users who were blocked 2 days ago
    const blockedUsers = await User.find({
      isBlocked: true,
      blockedUntil: { $lte: Date.now() },
    });

    // console.log("blockedUsers::: ", blockedUsers);

    // Step 2: Unblock each user found
    blockedUsers.forEach(async (user) => {
      await unblockUser(user._id);
    });
  } catch (error) {
    console.error("Error occurred:", error);
  }
});

// 🧑‍💻 When any error occurs then we are calling custom error middleware for all routes (Autometically)
import { ErrorMiddleware } from "../src/middleware/error.middleware.js";
import { limiter } from "./config/rateLimiter.js";
app.use(ErrorMiddleware);

export { app };
