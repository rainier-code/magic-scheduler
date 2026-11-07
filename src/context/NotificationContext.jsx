import { useMemo, useState } from "react";

import { NotificationContext } from "./notificationContext";
import { getEventNotifications } from "../utils/notifications";

const STORAGE_KEY = "magicSchedulerReadNotifications";

export function NotificationProvider({ events = [], children }) {
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));

      return updatedIds;
    });
  };

  const markAllAsRead = () => {
    const currentIds = notifications.map(
      (notification) => notification.id
    );

    setReadNotificationIds((previousIds) => {
      const updatedIds = [...new Set([...previousIds, ...currentIds])];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));

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