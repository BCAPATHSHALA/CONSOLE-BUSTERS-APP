import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Upload file to cloudinary from our server
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uploaded successfully
    console.log(`file is uploaded on cloudinary: ${response.url}`);
    // Remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// Delete file from cloudinary
const deleteFromCloudinary = async (publicURL) => {
  try {
    if (!publicURL) return null;

    // Extract the public ID from the public URL
    const publicID = publicURL.split("/").pop().split(".")[0];

    // Delete the file using the public ID from cloudinary
    await cloudinary.uploader.destroy(publicID);

    // File has been deleted successfully
    console.log(`file deleted from cloudinary`);
  } catch (error) {
    console.error("Error while deleting file from cloudinary:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
