
const Event = require("../models/Event");
const sendPushNotification = require("./sendPushNotification");

const checkEventReminders = async () => {
  try {
    // Get tomorrow's date in Philippine time.
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

    // Find events scheduled for tomorrow.
    const events = await Event.find({
      date: tomorrowDate,
      reminderSent: false,
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const event of events) {
      try {
        // Atomically claim the event before sending.
        const claimedEvent = await Event.findOneAndUpdate(
          {
            _id: event._id,
            reminderSent: false,
          },
          {
            $set: { reminderSent: true },
          },
          { new: true }
        );

        if (!claimedEvent) {
          continue;
        }

        const result = await sendPushNotification({
          title: "Upcoming Event Tomorrow",
          body: `You have a ${event.type} event for ${event.client} tomorrow at ${event.time}.`,
          url: "/",
        });

        if (result.sent > 0) {
          sentCount++;

          console.log(
            `Reminder successfully sent for ${event.client}'s event on ${event.date}.`
          );
        } else {
          failedCount++;

          // Allow another reminder check to retry.
          await Event.findByIdAndUpdate(event._id, {
            $set: { reminderSent: false },
          });

          console.log(
            `Reminder failed for ${event.client}'s event on ${event.date}.`
          );
        }
      } catch (eventError) {
        failedCount++;

        console.error(
          `Reminder error for ${event.client}:`,
          eventError
        );

        // Restore eligibility if sending or saving fails.
        await Event.findByIdAndUpdate(event._id, {
          $set: { reminderSent: false },
        });
      }
    }

    console.log("Event reminder check completed.");
    console.log(`Events found: ${events.length}`);
    console.log(`Reminders sent: ${sentCount}`);
    console.log(`Reminders failed: ${failedCount}`);

    return {
      found: events.length,
      sent: sentCount,
      failed: failedCount,
    };
  } catch (error) {
    console.error("Event reminder check failed:", error);
    throw error;
  }
};

module.exports = checkEventReminders;
