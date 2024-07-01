import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // Saving Access_Token To DB :
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

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

  // console.log(req.files);

  // check for images and then check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar Not Found!!!");

  // upload them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar Not Found!!!");

  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
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

const loginUser = asyncHandler(async (req, res) => {
  // take the data from req.body
  const { email, username, password } = req.body;

  // take username or email for login
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is Required");
  }

  // Find the user with that username or email
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) throw new ApiError(400, "User doesn't exist");

  //  take password from user
  // Use the Method to compare password with the password in DB
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Password is Incorrect!!!");

  // If matched ,login the user and generate the access_token and refresh_token store refresh_token in the DB
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // give both of the token to the user by cookies
  const loggedInUser = await User.findById(user_id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      200,
      { user: loggedInUser, accessToken, refreshToken },
      "User Logged In Successfully!"
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      // Returns us the updated value as response i.e. with undefined refreshToken
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out!"));
});

export const userController = { registerUser, loginUser, logoutUser };
