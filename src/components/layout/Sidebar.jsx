
import { useState } from "react";
import {
  FaMagic,
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaHistory,
  FaCog,
  FaBars,
  FaTimes,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";
import NotificationBell from "../common/NotificationBell";
import { useNotifications } from "../../context/useNotifications.js";

function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    readNotificationIds,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <header className="mobile-navbar">
        <div className="mobile-logo">
          <FaMagic className="logo-icon" />
          <h2>Magic Scheduler</h2>
        </div>

        <div className="mobile-navbar-actions">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            readNotificationIds={readNotificationIds}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      {menuOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={closeMenu}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          menuOpen ? "mobile-sidebar-open" : ""
        }`}
      >
        {/* LOGO */}
        <div className="logo">
          <div className="sidebar-logo-mark">
            <FaMagic className="logo-icon" />
          </div>

          <div className="sidebar-logo-text">
            <h2>Magic Scheduler</h2>
            <span>Event Scheduler</span>
          </div>

          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            <FaTimes />
          </button>
        </div>

        {/* DESKTOP NOTIFICATIONS */}
        <div className="sidebar-notification">
          <NotificationBell notifications={notifications} />
        </div>

        {/* MAIN NAVIGATION */}
        <nav className="sidebar-navigation" aria-label="Main navigation">
          <p className="navigation-label">MAIN MENU</p>

          <ul className="menu">
            <li>
              <NavLink to="/" end onClick={closeMenu}>
                <FaHome />
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/calendar" onClick={closeMenu}>
                <FaCalendarAlt />
                <span>Calendar</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/clients" onClick={closeMenu}>
                <FaUsers />
                <span>Clients</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/history" onClick={closeMenu}>
                <FaHistory />
                <span>History</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* BOTTOM NAVIGATION */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider"></div>

          <p className="navigation-label">SYSTEM</p>

          <ul className="menu" aria-label="System navigation">
            <li>
              <NavLink to="/settings" onClick={closeMenu}>
                <FaCog />
                <span>Settings</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
