import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description)
    throw new ApiError(
      400,
      "Both name and description of the Playlist are required"
    );

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  if (!playlist)
    throw new ApiError(400, "Something went wrong while creating the playlist");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Successfully Created the Playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId");

  const userPlaylists = await Playlist.find({ owner: userId });
  if (!userPlaylists)
    throw new ApiError(
      400,
      "Something went wrong while fetching the playlists"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylists,
        "Successfully fetched the playlists of the user"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid PlaylistId");

  const playlist = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          { $project: { title: 1, description: 1, duration: 1, owner: 1 } },
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
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  if (!playlist)
    throw new ApiError(400, "Something went wrong while fetching the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist[0], "Successfully fetched the playlist")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlistId");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { video: videoId },
    },
    { new: true }
  );

  if (!updatedPlaylist) throw new ApiError(400, "Playlist Not Found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Successfully added the video to the Playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlistId");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { video: videoId } },
    {
      new: true,
    }
  );
  if (!updatedPlaylist)
    throw new ApiError(
      400,
      "Something went wrong while adding the video to the playlist"
    );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Successfully removed the video from the Playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid PlaylistId");

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist)
    throw new ApiError(400, "Something went wrong while deleting the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Successfully deleted the playlist")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name && !description)
    throw new ApiError(400, "Nothing to Update in the playlist");

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid PlaylistId");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true }
  );
  if (!updatedPlaylist)
    throw new ApiError(400, "Something went wrong while updating the playlist");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Successfully Updated the Playlist")
    );
});

export const playlistController = {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
