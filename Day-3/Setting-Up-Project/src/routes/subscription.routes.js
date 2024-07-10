import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { subscriptionController } from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/c/:channelId")
  .get(subscriptionController.getUserChannelSubscribers)
  .post(subscriptionController.toggleSubscription);

router
  .route("/u/:subscriberId")
  .get(subscriptionController.getSubscribedChannels);

export default router;
