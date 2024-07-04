import { verifyJWT } from "../middlewares/auth.middleware.js";
import { videoController } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

import { Router } from "express";
const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file after all only loggedIn user can CRUD video

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  videoController.publishAVideo
);

router.route("/:videoId").get(verifyJWT, videoController.getVideoById);
router.route("/update/:videoId").patch(verifyJWT, videoController.updateVideo);

router
  .route("/update-thumbnail/:videoId")
  .patch(
    verifyJWT,
    upload.single("thumbnail"),
    videoController.updateVideoThumbnail
  );

export default router;
