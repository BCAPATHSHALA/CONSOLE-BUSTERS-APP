import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// MongoDb Connection Using Async & Await method and Error Handling with its block try and catch
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MongoDB connected on DB HOST::::::::::::::: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`MongoDB connection failed::::::::::: ${error}`);
    process.exit(1);
  }
};
