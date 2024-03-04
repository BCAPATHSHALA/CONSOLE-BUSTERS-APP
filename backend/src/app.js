import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Configure the CORS middleware to set frontendURI
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);

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
// import userRouter from "./routes/user.routes.js";

// Routes declaration middlewares
// app.use("/api/v1/users", userRouter);

export { app };
