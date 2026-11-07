
export function getEventNotifications(events = []) {
  const notifications = [];

  // Get today's date using the computer's local timezone.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromToday = new Date(today);
  sevenDaysFromToday.setDate(today.getDate() + 7);

  events.forEach((event) => {
    if (!event.date) return;

    // Parse YYYY-MM-DD as a local date.
    const [year, month, day] = event.date.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);
    eventDate.setHours(0, 0, 0, 0);

    // Ignore past events and events more than 7 days away.
    if (
      eventDate < today ||
      eventDate > sevenDaysFromToday
    ) {
      return;
    }

    const daysDifference = Math.round(
      (eventDate - today) / (1000 * 60 * 60 * 24)
    );

    const details =
    daysDifference === 0
        ? {
            type: "Today",
            message: `${event.client}'s ${event.type} event is today`,
        }
        : daysDifference === 1
        ? {
            type: "Tomorrow",
            message: `${event.client}'s ${event.type} event is tomorrow`,
            }
        : {
            type: "Upcoming",
            message: `${event.client}'s ${event.type} event is in ${daysDifference} days`,
            };

        notifications.push({
            id: `${event._id}-${details.type.toLowerCase()}`,
            type: details.type,
            message: details.message,
            date: event.date,
            time: event.time,
            event,
        });
  });

  // Sort notifications by date and then by time.
  notifications.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return (a.time || "").localeCompare(b.time || "");
  });

  return notifications;
}
