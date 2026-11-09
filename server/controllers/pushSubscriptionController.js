const PushSubscription = require("../models/PushSubscription");

const subscribeToPushNotifications = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        message: "Invalid push subscription.",
      });
    }

    const existingSubscription = await PushSubscription.findOne({
      endpoint,
    });

    if (existingSubscription) {
      return res.status(200).json({
        message: "Device is already subscribed.",
      });
    }

    await PushSubscription.create({
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return res.status(201).json({
      message: "Device subscribed successfully.",
    });
  } catch (error) {
    console.error("Subscribe error:", error);

    return res.status(500).json({
      message: "Unable to save push subscription.",
    });
  }
};

module.exports = {
  subscribeToPushNotifications,
};