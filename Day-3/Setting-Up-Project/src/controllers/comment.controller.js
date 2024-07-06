import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const DBQuery = [];

  DBQuery.push(
    {
      $lookup: {
        from: "users",
        localField: "commentBy",
        foreignField: "_id",
        as: "commentBy",
      },
    },
    {
      $addFields: {
        commentBy: { $first: "$commentBy.username" },
      },
    },
    { $sort: { createdAt: -1 } }
  );

  const comments = await Comment.aggregatePaginate(Comment.aggregate(DBQuery), {
    page: +page,
    limit: +limit,
  });

  if (!comments) throw new ApiError(400, "No comments Found");

  res.status(200).json(
    new ApiResponse(200, {
      comments: comments.docs,
      currentPage: +page,
      limit: +limit,
      totalDocs: comments.totalDocs || 0,
      totalPages: comments.totalPages,
      nextPage: comments.nextPage,
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) throw new ApiError(400, "Comment is Required");

  const comment = await Comment.create({
    content,
    commentOn: videoId,
    commentBy: req.user?._id,
  });

  if (!comment)
    throw new ApiError(400, "Something went wrong while uploading comment");

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Commented Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const commentFromDB = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  if (!commentFromDB) throw new ApiError(400, "Comment Not Found to update");

  return res
    .status(200)
    .json(new ApiResponse(200, commentFromDB, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const response = await Comment.findByIdAndDelete(commentId);
  if (!response)
    throw new ApiError(400, "Something went wrong while deleting the comment");

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment Deleted Successfully"));
});

export const commentController = {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
};
