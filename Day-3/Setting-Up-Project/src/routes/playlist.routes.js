import { Router } from "express";
import { playlistController } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(playlistController.createPlaylist);

router
  .route("/:playlistId")
  .get(playlistController.getPlaylistById)
  .patch(playlistController.updatePlaylist)
  .delete(playlistController.deletePlaylist);

router
  .route("/add/:playlistId/:videoId")
  .patch(playlistController.addVideoToPlaylist);

router
  .route("/remove/:playlistId/:videoId")
  .patch(playlistController.removeVideoFromPlaylist);

router.route("/user/:userId").get(playlistController.getUserPlaylists);

export default router;
