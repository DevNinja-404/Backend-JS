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
router.route("/logout").post(verifyJWT, userController.logoutUser);
// It is a secured route but why not using the middleware ,cause whether the user is valid or not,in our refreshAccessToken controller logic we verify the user so, no need to add the middleware.
router.route("/refresh-token").post(userController.refreshAccessToken);

export default router;
