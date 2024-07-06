import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteAsset } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const getVideoWithOwnerDetails = async (videoId) => {
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              // In MongoDB, when you perform a $lookup and include a sub-pipeline with a $project stage, the _id field is included by default unless you explicitly exclude it. This means that even if you do not specify _id in the $project stage, it will still be included in the resulting documents.

              // To exclude the _id field from the owner array elements, you need to explicitly set _id: 0 in the $project stage.
              _id: 0,
              email: 1,
              username: 1,
              fullName: 1,
              coverImage: 1,
              thumbnail: 1,
              isPublished: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: { owner: { $first: "$owner" } },
    },
  ]);
  return video[0];
};

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    title,
    sortBy = "createdAt",
    sortType = "asc",
    userId,
  } = req.query;

  const DBQuery = [];

  if (title) {
    DBQuery.push({
      $match: {
        title: new RegExp(title, "gi"),
      },
    });
  }

  if (userId) {
    DBQuery.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  DBQuery.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $addFields: { owner: { $first: "$owner.fullName" } } },
    {
      // The $facet stage allows for multiple aggregation pipelines to run within a single stage. In this case, there are two pipelines: one for metadata and one for data.
      $facet: {
        metadata: [
          {
            $count: "total", // Counts the total number of documents that pass through this stage and adds the count to the 'total' field
          },
        ],
        data: [
          {
            $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
          },
          {
            $skip: (+page - 1) * +limit,
          },
          {
            $limit: +limit,
          },
        ],
      },
    },
    {
      $addFields: {
        total: {
          $arrayElemAt: ["$metadata.total", 0],
        },
      },
    },
    {
      $project: {
        metadata: 0,
      },
    }
  );

  const videos = await Video.aggregate(DBQuery);
  if (!videos) throw new ApiError(400, "Videos Not Found");

  res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: videos[0].data,
        page: +page,
        limit: +limit,
        total: videos[0].total || 0,
      },
      "All Videos Fetched Successfully!!!"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((eachField) => eachField === ""))
    throw new ApiError(400, "Title and Description of the video are required");

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) throw new ApiError(400, "Video File not found");

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail not found");

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  if (!videoFile)
    throw new ApiError(400, "Error while uploading the video on Cloudinary");

  console.log(videoFile);

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail)
    throw new ApiError(
      400,
      "Error while uploading the thumbnail on Cloudinary"
    );

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    owner: req.user?._id,
  });

  if (!video)
    throw new ApiError(
      400,
      "Something went wrong while creating the video to DB"
    );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await getVideoWithOwnerDetails(videoId);
  if (!video) throw new ApiError(400, "No video Found");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!title || !description)
    throw new ApiError(400, "Both title and description are required");

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title, description } },
    { new: true }
  );

  if (!video)
    throw new ApiError(400, "Error while updating the video metadata");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Metadata Updated Successfully"));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail Not Found");

  const thumbnailFromCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnailFromCloudinary)
    throw new ApiError(400, "Error while uploading thumbnail to Cloudinary");

  const video = await Video.findById(videoId);

  const { result } = await deleteAsset(
    video.thumbnail.split("/").pop().split(".")[0]
  );
  if (result !== "ok")
    throw new ApiError(400, "Previous Thumbnail Not Deleted");

  video.thumbnail = thumbnailFromCloudinary.url;
  // .save is only defined on the documents which are created or fetched as a Mongoose document.so tyo getVideoWithOwnerDetails() leh return gareko data ma .save defined hudiana.
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Thumbnail Updated Successfully!!!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const response = await Video.deleteOne({ _id: videoId });
  if (!response)
    throw new ApiError(400, "Something went wrong while deleting the video");

  res
    .status(200)
    .json(new ApiResponse(200, response, "Video Deleted Successfully"));
});

const togglePublishedStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video)
    throw new ApiError(400, "Video Not Found To Toggle Published Status");
  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, video, "Published Status Toggled Successfuly"));
});

export const videoController = {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  updateVideoThumbnail,
  deleteVideo,
  togglePublishedStatus,
};
