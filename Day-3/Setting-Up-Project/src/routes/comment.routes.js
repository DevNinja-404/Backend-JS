import { Router } from "express";
import { commentController } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/video/:videoId")
  .get(commentController.getVideoComments)
  .post(commentController.addComment);

router
  .route("/:commentId")
  .delete(commentController.deleteComment)
  .patch(commentController.updateComment);

export default router;
