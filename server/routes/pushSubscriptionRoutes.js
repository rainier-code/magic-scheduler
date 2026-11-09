const express = require("express");

const {
  subscribeToPushNotifications,
} = require("../controllers/pushSubscriptionController");

const {
  unsubscribeFromPushNotifications,
} = require("../controllers/pushUnsubscriptionController");

const {
  testPushNotification,
} = require("../controllers/pushTestController");

const router = express.Router();

router.post("/subscribe", subscribeToPushNotifications);
router.delete("/unsubscribe", unsubscribeFromPushNotifications);
router.post("/test", testPushNotification);

module.exports = router;