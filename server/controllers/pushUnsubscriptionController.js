const PushSubscription = require("../models/PushSubscription");

const unsubscribeFromPushNotifications = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        message: "Subscription endpoint is required.",
      });
    }

    const result = await PushSubscription.deleteOne({ endpoint });

    return res.status(200).json({
      message: result.deletedCount
        ? "Device unsubscribed successfully."
        : "Subscription was not found.",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);

    return res.status(500).json({
      message: "Unable to remove push subscription.",
    });
  }
};

module.exports = {
  unsubscribeFromPushNotifications,
};