import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  userController.registerUser
);

router.route("/login").post(userController.loginUser);

// Secured-Routes :

// logout :
router.route("/logout").post(verifyJWT, userController.logoutUser);

// It is a secured route but why not using the middleware ,cause whether the user is valid or not,in our refreshAccessToken controller logic we verify the user so, no need to add the middleware.
// refresh-token :
router.route("/refresh-token").post(userController.refreshAccessToken);

// change-password :
router
  .route("/change-password")
  .post(verifyJWT, userController.changeCurrentPassword);

// get-current-user :
router.route("/current-user").get(verifyJWT, userController.getCurrentUser);

// update-account-details :
router
  .route("/update-account")
  .patch(verifyJWT, userController.updateAccountDetails);

// update-account-avatar :
router
  .route("/update-avatar")
  .patch(
    verifyJWT,
    upload.single("avatar"),
    userController.updateAccountAvatar
  );

// update-account-coverImage :
router
  .route("/update-cover-image")
  .patch(
    verifyJWT,
    upload.single("coverImage"),
    userController.updateAccountCoverImage
  );

// get-user-channel-profile :
router
  .route("/channel/:username")
  .get(verifyJWT, userController.getUserChannelProfile);

// getWatchHistory
router.route("/watch-history").get(verifyJWT, userController.getWatchHistory);

export default router;
