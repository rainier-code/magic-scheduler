
const crypto = require("crypto");
const checkEventReminders = require("../utils/eventReminder");

const runScheduledReminders = async (req, res) => {
  try {
    const expectedSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers["x-cron-secret"];

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

    await checkEventReminders();

    return res.status(200).json({
      message: "Scheduled event reminder check completed.",
    });
  } catch (error) {
    console.error("Scheduled reminder failed:", error);

    return res.status(500).json({
      message: "Failed to run scheduled reminders.",
    });
  }
};

module.exports = { runScheduledReminders };
