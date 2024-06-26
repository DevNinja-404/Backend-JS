import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) throw new error("File Not Found!!!");

    // uploading the file on cloudinary :
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // If file has uploaded successfully then :
    console.log("File Uploaded On Cloudinary Successfully.", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //removes the locally saved temporary file as the uploading to the cloudinary failed.
    return null;
  }
};

export { uploadOnCloudinary };
