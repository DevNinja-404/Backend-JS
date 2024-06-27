import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // we need to get userdetails from frontend.
  const { username, email, fullName, password } = req.body;

  // Validation : check if the required fields are empty :
  if (
    [username, email, fullName, password].some(
      (eachField) => eachField?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exixts : u can use username or email
  // If we find the user with the same username or email in our DB, it means that user Already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) throw new ApiError(409, "User Already Exists!!!");

  // check for images and then check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar Not Found!!!");

  // upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar Not Found!!!");

  if (coverImageLocalPath) {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) throw new ApiError(400, "CoverImage Not Found!!!");
  }

  // create user Object for its entry to the DB cause MongoDB is NoSQL DB so generally an object is passed for its entry to DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  // remove password and refresh token from the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check if user created successfully
  if (!createdUser)
    throw new ApiError(500, "Something Went Wrong while registering the user");

  // if created return the response

  // we know postman shows us these status so it expects that status to get as res.status(status_code) which is why we sent that
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

export const userController = { registerUser };
