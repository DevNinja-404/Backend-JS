import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });

  if (!isSubscribed) {
    const newSubscriber = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });
    if (!newSubscriber)
      throw new ApiError(
        400,
        "Something went wrong while Subscribing to the channel"
      );

    return res
      .status(200)
      .json(new ApiResponse(200, newSubscriber, "Subscribed to the channe"));
  }

  const unsubscribed = await Subscription.findOneAndDelete({
    subscriber: req.user?._id,
    channel: channelId,
  });
  if (!unsubscribed)
    throw new ApiError(
      400,
      "Something went wrong while UnSubscribing to the channel"
    );

  return res
    .status(200)
    .json(new ApiResponse(200, unsubscribed, "UnSubscribed from the channe"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: { email: 1, username: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: { $first: "$subscriber" },
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  if (!subscribers)
    throw new ApiError(
      400,
      "Something went Wrong while fetching the subscribers list"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers List Fetched Successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  // Have a doubt, well it is certain that only the logged in users can fetch their subscribed channels so why don't we use req.user?._id after all we have used the authMiddleware thorughtout the subscribtion route.

  const { subscriberId } = req.params;
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: { username: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: { $first: "$channel" },
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
  ]);
  if (!subscribedChannels)
    throw new ApiError(
      400,
      "Something went wrong while fetching the subscribedChannel list"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed Channels fetched successfully!!!"
      )
    );
});

export const subscriptionController = {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};
