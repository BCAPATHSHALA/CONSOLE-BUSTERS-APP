import dotenv from "dotenv";
import { connectDB } from "./database/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

// When Mongodb connects successfully then it returns a promise so Our server app will listen when Mongodb connected successfully
connectDB()
  .then(() => {
    // Start our Express server
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Server is running on port:::::::::: ${process.env.PORT || 8000}`
      );
    });
  })
  .catch((err) => {
    console.log(`Mongodb connection failed !!! ${err}`);
  });
