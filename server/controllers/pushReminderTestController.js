
const crypto = require("crypto");
const checkEventReminders = require("../utils/eventReminder");

const testEventReminder = async (req, res) => {
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

    const result = await checkEventReminders();

    return res.status(200).json({
      message: "Event reminder check completed.",
      results: result,
    });
  } catch (error) {
    console.error("Reminder test failed:", error);

    return res.status(500).json({
      message: "Failed to test event reminders.",
    });
  }
};

module.exports = { testEventReminder };