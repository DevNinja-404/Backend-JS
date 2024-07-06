import { verifyJWT } from "../middlewares/auth.middleware.js";
import { videoController } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

import { Router } from "express";
const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file after all only loggedIn user can CRUD video

router.route("/").get(videoController.getAllVideos);

router.route("/upload-video").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  videoController.publishAVideo
);

router.route("/:videoId").get(videoController.getVideoById);
router.route("/update/:videoId").patch(videoController.updateVideo);

router
  .route("/update-thumbnail/:videoId")
  .patch(upload.single("thumbnail"), videoController.updateVideoThumbnail);

router.route("/delete/:videoId").delete(videoController.deleteVideo);

router
  .route("/toggle-published/:videoId")
  .patch(videoController.togglePublishedStatus);
export default router;
