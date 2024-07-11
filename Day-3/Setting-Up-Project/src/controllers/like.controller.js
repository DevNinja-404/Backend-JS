import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // findOne must be used because if findOne doesn't find any document satisfying the conditions then it returns null=>false where find will return an (Empty Array) => true
  const isLikedVideo = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!isLikedVideo) {
    const likedVideo = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    if (!likedVideo) throw new ApiError(400, "Was unable to like the video");

    return res
      .status(200)
      .json(new ApiResponse(200, likedVideo, "Successfully liked the video"));
  }

  const unlikedVideo = await Like.findByIdAndDelete(isLikedVideo._id);
  if (!unlikedVideo)
    throw new ApiError(400, "Something went wrong while disliking the video");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        unlikedVideo,
        "Successfully removed the like from the video"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // findOne must be used because if findOne doesn't find any document satisfying the conditions then it returns null=>false where find will return an (Empty Array) => true
  const isLikedComment = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!isLikedComment) {
    const likedComment = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    if (!likedComment)
      throw new ApiError(400, "Was unable to like the comment");

    return res
      .status(200)
      .json(
        new ApiResponse(200, likedComment, "Successfully liked the comment")
      );
  }

  const unlikedComment = await Like.findByIdAndDelete(isLikedComment._id);
  if (!unlikedComment)
    throw new ApiError(400, "Something went wrong while disliking the comment");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        unlikedComment,
        "Successfully removed the like from the comment"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // findOne must be used because if findOne doesn't find any document satisfying the conditions then it returns null=>false where find will return an (Empty Array) => true
  const isLikedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!isLikedTweet) {
    const likedTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    if (!likedTweet) throw new ApiError(400, "Was unable to like the tweet");

    return res
      .status(200)
      .json(new ApiResponse(200, likedTweet, "Successfully liked the tweet"));
  }

  const unlikedTweet = await Like.findByIdAndDelete(isLikedTweet._id);
  if (!unlikedTweet)
    throw new ApiError(400, "Something went wrong while disliking the tweet");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        unlikedTweet,
        "Successfully removed the like from the tweet"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        $and: [
          { video: { $exists: true } },
          { likedBy: new mongoose.Types.ObjectId(req.user?._id) },
        ],
      },
    },
    // Getting Video Details:
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
          //   Getting Owner Details
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: { owner: { $first: "$owner" } },
          },
        ],
      },
    },
    {
      $addFields: { video: { $first: "$video" } },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  if (!likedVideos)
    throw new ApiError(
      400,
      "Something went wrong while fetching the liked videos"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideos,
        "Successfully fetched the liked videos!!!"
      )
    );
});

export const likeController = {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
};
