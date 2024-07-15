import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user?._id) } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likes: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        total: { $count: {} },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
      },
    },
    { $project: { _id: 0, total: 1, totalViews: 1, totalLikes: 1 } },
  ]);

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(req.user?._id) },
    },
    { $count: "total" },
  ]);

  if (!videos) throw new ApiError(400, "Cannot find the videos");
  if (!subscribers) throw new ApiError(400, "Cannot find the subscribers");

  const totalVideos = videos[0].total;
  const totalViews = videos[0].totalViews;
  const totalLikes = videos[0].totalLikes;
  const totalSubscribers = subscribers[0].total;

  const channelStats = {
    totalVideos,
    totalViews,
    totalLikes,
    totalSubscribers,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelStats,
        "Successfully Fetched The Channel Statistics"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user?._id) } },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    { $addFields: { likes: { $size: "$likes" } } },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        likes: 1,
      },
    },
  ]);

  if (!videos) throw new ApiError(400, "No Videos Found");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Successfully Fetched the Videos"));
});

export const dashboardController = { getChannelStats, getChannelVideos };
