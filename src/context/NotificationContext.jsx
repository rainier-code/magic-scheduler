import { useMemo, useState } from "react";

import { NotificationContext } from "./notificationContext";
import { getEventNotifications } from "../utils/notifications";

const STORAGE_KEY = "magicSchedulerReadNotifications";

export function NotificationProvider({ events = [], children }) {
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed)
        ? parsed.filter((notificationId) => typeof notificationId === "string")
        : [];
    } catch (error) {
      console.error("Failed to load read notifications:", error);
      return [];
    }
  });

  const notifications = useMemo(
    () => getEventNotifications(events),
    [events]
  );

  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification.id)
  ).length;

  const markAsRead = (notificationId) => {
    setReadNotificationIds((currentIds) => {
      if (currentIds.includes(notificationId)) return currentIds;

      const updatedIds = [...currentIds, notificationId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
      } catch (error) {
        console.error("Failed to save notification read state:", error?.name || "StorageError");
      }

      return updatedIds;
    });
  };

  const markAllAsRead = () => {
    const currentIds = notifications.map(
      (notification) => notification.id
    );

    setReadNotificationIds((previousIds) => {
      const updatedIds = [...new Set([...previousIds, ...currentIds])];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
      } catch (error) {
        console.error("Failed to save notification read state:", error?.name || "StorageError");
      }

      return updatedIds;
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        readNotificationIds,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
