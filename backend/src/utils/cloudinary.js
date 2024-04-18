import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Upload file from local disk to cloudinary
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

// Delete file from cloudinary except video
const deleteFromCloudinary = async (publicURL) => {
  try {
    // Ensure publicURL is provided
    if (!publicURL) return null;

    // Extract the public ID from the public URL
    const publicId = publicURL.split("/").pop().split(".")[0];

    // Delete the file using the public ID from cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // invalidate the CDN cache
    });

    // Check if the deletion was successful
    if (result.result === "ok") {
      console.log("file deleted from cloudinary");
    } else {
      console.error("Failed to delete file from cloudinary");
    }
  } catch (error) {
    console.error("Error while deleting file from cloudinary:", error);
  }
};

// Delete video file from cloudinary
const deleteVideoFromCloudinary = async (publicURL) => {
  try {
    // Ensure publicURL is provided
    if (!publicURL) return null;

    // Extract the public ID from the public URL
    const publicId = publicURL.split("/").pop().split(".")[0];

    // Delete the video from Cloudinary using its public ID
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video", // this line very important while deleting the video
      invalidate: true, // invalidate the CDN cache
    });

    // Check if the deletion was successful
    if (result.result === "ok") {
      console.log("file deleted from cloudinary");
    } else {
      console.error("Failed to delete file from cloudinary");
    }
  } catch (error) {
    console.error("Error while deleting file from cloudinary:", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary };
