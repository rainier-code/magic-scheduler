
import { useRef, useState } from "react";
import {
  FaBell,
  FaTimes,
  FaCalendarAlt,
  FaCheck,
  FaCheckDouble,
  FaRegBell,
} from "react-icons/fa";

function NotificationBell({
  notifications = [],
  unreadCount = 0,
  readNotificationIds = [],
  markAsRead,
  markAllAsRead,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const bellRef = useRef(null);

  const toggleNotifications = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const bellBounds = bellRef.current?.getBoundingClientRect();

    if (bellBounds) {
      const panelWidth = Math.min(360, window.innerWidth - 24);
      const preferredLeft = window.innerWidth <= 500
        ? bellBounds.right - panelWidth
        : bellBounds.right + 10;
      const left = Math.max(
        12,
        Math.min(preferredLeft, window.innerWidth - panelWidth - 12)
      );
      const top = Math.max(
        12,
        Math.min(bellBounds.bottom + 8, window.innerHeight - 500)
      );

      setDropdownPosition({ left, top });
    }

    setIsOpen(true);
  };

  const handleMarkAsRead = (notificationId) => {
    if (typeof markAsRead !== "function") {
      console.error("markAsRead was not passed to NotificationBell.");
      return;
    }

    markAsRead(notificationId);
  };

  return (
    <div className="notification-container">
      <button
        ref={bellRef}
        type="button"
        className={`notification-bell ${
          isOpen ? "active" : ""
        } ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={toggleNotifications}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FaBell />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <span className="notification-desktop-label" aria-hidden="true">
        Notifications
      </span>

      {isOpen && (
        <div className="notification-dropdown" style={dropdownPosition || undefined}>
          <div className="notification-header">
            <div className="notification-heading">
              <div className="notification-heading-icon">
                <FaBell />
              </div>

              <div>
                <h3>Notifications</h3>
                <p>
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="notification-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <FaTimes />
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="notification-toolbar">
              <button
                type="button"
                onClick={() => {
                  if (typeof markAllAsRead === "function") {
                    markAllAsRead();
                  }
                }}
              >
                <FaCheckDouble />
                Mark all as read
              </button>
            </div>
          )}

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <FaRegBell />
                </div>
                <h4>You're all caught up</h4>
                <p>No upcoming event notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = readNotificationIds.includes(
                  notification.id
                );

                return (
                  <div
                    className={`notification-item ${
                      isRead ? "read" : "unread"
                    }`}
                    key={`${notification.id}-${notification.type}`}
                  >
                    <div className="notification-icon">
                      <FaCalendarAlt />
                    </div>

                    <div className="notification-content">
                      <div className="notification-item-heading">
                        <strong>{notification.type}</strong>

                        {isRead ? (
                          <span className="notification-read-status">
                            <FaCheckDouble />
                            Read
                          </span>
                        ) : (
                          <span className="notification-unread-status">
                            <span className="unread-indicator" />
                            New
                          </span>
                        )}
                      </div>

                      <p>{notification.message}</p>

                      {notification.time && (
                        <small>
                          Scheduled at {notification.time}
                        </small>
                      )}

                      {!isRead && (
                        <button
                          type="button"
                          className="notification-read-button"
                          onClick={() =>
                            handleMarkAsRead(notification.id)
                          }
                        >
                          <FaCheck />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="notification-footer">
            <span>Magic Scheduler</span>
            <span>Event reminders</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
