import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteAsset } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
  const loggedInUser = await User.findById(user._id).select(
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
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully!"
      )
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
    .json(new ApiResponse(200, {}, "User Logged Out!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  // jwt.verify() is used to decode the encoded token,it uses the same secret to encode and decode as a result secret to neccessary to decode the encoded token
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh Token is Expired or Used!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refressed Successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while refreshing the accessToken!"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid Old Password");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully!!!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Got The Current User"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email)
    throw new ApiError(400, "No Updation On the details!!!");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Account Details Updated Successfully!!!")
    );
});

const updateAccountAvatar = asyncHandler(async (req, res) => {
  // At the endPoint using this controller we will be uploading only the avatar so req.file?.path
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar Not Found!!!");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar)
    throw new ApiError(400, "Error while uploading avatar on Cloudinary");

  // Well new avatar is uploaded to Cloudinary but we need to delete the prev one from the cloudinary

  // Accessing The User :
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  // Deleting The Previous Image :
  const { result } = await deleteAsset(
    user.avatar.split("/").pop().split(".")[0]
  );
  if (result !== "ok") throw new ApiError(400, "Previous Avatar Not Deleted");

  // Updating The Document with new avatar :
  user.avatar = avatar.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully!!!"));
});

const updateAccountCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) throw new ApiError(400, "coverImage Not Found");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage)
    throw new ApiError(400, "Error while uploading coverImage on Cloudinary");

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );

  // since coverImage was optional to upload what if it was previously empty and now we are adding the image then we wouldn't be able get the url and hence not the publicId of coverImgae so a check before using the deleteAsset code
  if (user.coverImage) {
    const { result } = await deleteAsset(
      user.coverImage.split("/").pop().split(".")[0]
    );
    if (result !== "ok")
      throw new ApiError(400, "Previous coverImage Not Deleted");
  }

  user.coverImage = coverImage.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated Successfully!!!"));
});

// These two are left to test, will test after making videoControllers
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "Username is Missing");

  // User.aggregate() is a method which takes an array and inside it we write our stages in an object.
  const channel = await User.aggregate([
    // $match pipeline gives u the data by matching the username(key in our userSchema) having value as username.toLowerCase()(value of the username which we want to match with)
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },

    // Now we want to find the subscribers of the channel :

    // The $lookup stage performs a join operation between two collections. It allows you to combine data from a foreign collection into the current collection based on matching values from specified fields.
    // from: The name of the foreign collection to join with.
    // localField: The field from the input documents.
    // foreignField: The field from the documents in the 'from' collection.
    // as: The name of the new array field to add to the input documents that contains the matching documents from the from collection.
    // Here we are matching the _id of our local Collection with channel of our foreignCollection if it matches then it joins the details of the foreign Collection as  subscribers : Array(inside the array we have the details of the matched document of the foreign Collection)

    // Remember if u want to use the localField in the aggregation always use $ in front
    {
      $lookup: {
        from: "subscriptions",
        localField: "$_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    // We want to find whom I have Subscribed :
    {
      $lookup: {
        from: "subscriptions",
        localField: "$_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    // In MongoDB, the $addFields stage in an aggregation pipeline is used to add new fields to the documents or to modify existing fields. This stage allows you to create computed fields, add constant values, or perform various transformations on the document fields.
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        // So to check whether I am subscribed to the channel i an trying to view page of we use the following :
        // $cond to add the condition
        // if to specify the condition
        // $in(checks in both array and object) to check whether i am inside the subscribers list of the channel or not (subscribers is our field in the given userSchema of the channel we want to view, inside that we have channel and subscriber so we see if we are one of that subscriber )
        // true then add true in isSubscribed field
        // else add false in isSubscribed field
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // The $project stage in MongoDB's aggregation pipeline is used to include, exclude, or add new fields to the documents.
    // 1 to include the field
    {
      $project: {
        email: 1,
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError(400, "Channel doesn't Exist");

  // The aggregation returns the array of the documents of our collection in which each documents is object but we used the $match to match the username and as its unique for our schema we will get only one document in our array
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel Fetched Successfully!!!")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // From the req.user?._id we get the Idstring not the mongoDB id but as we r using mongoose when we query our DB ,mongoose converts that string into the mongoDB ObjectId as ObjectId("IdString").
  const user = await User.aggregate([
    // Aggregation Pipeline codes directly goes to our DB so we first need to convert our _id to ObjectId as:
    { $match: { _id: new mongoose.Types.ObjectId(req.user?._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "$watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // After writing pipeline we can write multiple pipelines within it but remember we r currently in videoSchema and looking up in userSchema inside the pipeline
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "$owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }],
            },
          },
          // The document from above pipeline returns an array in the owner field with one object(first-object) in it having our projected fields as key-value inside the object but we want directly show owner-Details as an object rather than being it nested in the array basically it is going to be easier in frontend
          {
            $addFields: { owner: { $first: "$owner" } },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "WatchHistory Fetched Successfully!!!"
      )
    );
});

export const userController = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAccountAvatar,
  updateAccountCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
