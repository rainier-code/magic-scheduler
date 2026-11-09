
const crypto = require("crypto");
const sendPushNotification = require("../utils/sendPushNotification");

const testPushNotification = async (req, res) => {
  try {
    const expectedSecret = process.env.TEST_PUSH_SECRET;
    const providedSecret = req.headers["x-test-secret"];

    if (!expectedSecret || !providedSecret) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const expected = Buffer.from(expectedSecret);
    const provided = Buffer.from(providedSecret);

    if (
      expected.length !== provided.length ||
      !crypto.timingSafeEqual(expected, provided)
    ) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const result = await sendPushNotification({
      title: "Magic Scheduler",
      body: "Your push notifications are working!",
      url: "/",
    });

    return res.status(200).json({
      message: "Push notification test completed.",
      result,
    });
  } catch (error) {
    console.error("Push test failed:", error);

    return res.status(500).json({
      message: "Failed to send test notification.",
    });
  }
};

module.exports = {
  testPushNotification,
};
