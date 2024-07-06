import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Tweet Content is Required");

  const tweet = await Tweet.create({ content, tweetBy: req.user?._id });

  if (!tweet)
    throw new ApiError(400, "Something went wrong while creating your tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweeted Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "des",
    userId,
  } = req.params;

  const DBQuery = [
    {
      $match: {
        tweetBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweetBy",
        foreignField: "_id",
        as: "tweetBy",
      },
    },
    {
      $addFields: { tweetBy: { $first: "$tweetBy.username" } },
    },
  ];

  const options = {
    page: +page,
    limit: +limit,
  };

  const tweets = await Tweet.aggregatePaginate(
    Tweet.aggregate(DBQuery),
    options
  );

  if (!tweets) throw new ApiError(400, "No Tweets Found");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets: tweets.docs,
        currentPage: +page,
        limit: +limit,
        totalDocs: tweets.totalDocs || 0,
        totalPages: tweets.totalPages,
        nextPage: tweets.nextPage,
      },
      "All Tweets Fetched Successfully"
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const { content } = req.body;
  if (!content)
    throw new ApiError(400, "Tweet Content is requird to update the tweet");

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true }
  );
  if (!tweet) throw new ApiError(400, "Tweet Didn't Updated Succesfully");

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet)
    throw new ApiError(400, "Something went wrong while deleting your tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Deleted Successfully"));
});

export const tweetController = {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
};
