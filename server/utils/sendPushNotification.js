require("dotenv").config();

const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (payload) => {
  const subscriptions = await PushSubscription.find();

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const subscription of subscriptions) {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );

      sent++;
    } catch (error) {
      failed++;

      console.error(
        "Push notification failed:",
        error.statusCode || error.message
      );

      // Remove subscriptions that are no longer valid.
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({
          _id: subscription._id,
        });

        removed++;
      }
    }
  }

  return {
    total: subscriptions.length,
    sent,
    failed,
    removed,
  };
};

module.exports = sendPushNotification;