const Event = require("../models/Event");
const sendPushNotification = require("./sendPushNotification");

const checkEventReminders = async () => {
  try {
    // Get tomorrow's date in YYYY-MM-DD format.
    const philippinesDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    }).format(new Date());

    const [year, month, day] = philippinesDate.split("-").map(Number);

    const tomorrowDate = new Date(
    Date.UTC(year, month - 1, day + 1)
    )
    .toISOString()
    .split("T")[0];

    // Find events happening tomorrow that haven't received a reminder.
    const events = await Event.find({
      date: tomorrowDate,
      reminderSent: false,
    });

    for (const event of events) {
        const result = await sendPushNotification({
        title: "Upcoming Event Tomorrow",
        body: `You have a ${event.type} event for ${event.client} tomorrow at ${event.time}.`,
        url: "/",
        });

        // Mark as sent only if at least one device received the push.
        if (result.sent > 0) {
        event.reminderSent = true;
        await event.save();
        }

      console.log(
        `Reminder sent for ${event.client}'s event on ${event.date}`
      );
    }

    console.log(
      `Event reminder check completed. ${events.length} event(s) found for tomorrow.`
    );
  } catch (error) {
    console.error("Event reminder check failed:", error);
  }
};

module.exports = checkEventReminders;