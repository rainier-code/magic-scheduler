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

const {
  testEventReminder,
} = require("../controllers/pushReminderTestController");

const {
  runScheduledReminders,
} = require("../controllers/cronReminderController");

const router = express.Router();

router.post("/subscribe", subscribeToPushNotifications);
router.delete("/unsubscribe", unsubscribeFromPushNotifications);
router.post("/test", testPushNotification);
router.post("/test-reminder", testEventReminder);
router.post("/run-reminders", runScheduledReminders);

module.exports = router;