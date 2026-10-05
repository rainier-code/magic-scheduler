import { useState } from "react";
import Layout from "../components/layout/Layout";
import dayjs from "dayjs";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import EditEvent from "../components/events/EditEvent";
import axios from "axios";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";

const formatEventTime = (time) => {
  if (!time) return "";

  return dayjs(`2000-01-01 ${time}`).format("h:mm A");
};

function Calendar({
  events,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = startOfMonth.day();

  const days = [];

  // Empty spaces before the first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const previousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const goToToday = () => {
    setCurrentMonth(dayjs());
  };

  const getEventsForDay = (day) => {
    if (!day) {
      return [];
    }

    const date = currentMonth
      .date(day)
      .format("YYYY-MM-DD");

    return events
      .filter((event) => event.date === date)
      .sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
  };

  const handleDelete = async (eventId) => {
    try {
      const deletedEvent = events.find(
        (event) => event._id === eventId
      );

      await axios.delete(
        `http://localhost:5000/api/events/${eventId}`
      );

      setSelectedEvent(null);
      onDeleteEvent(eventId);
      setDeletingEventId(null);

      setDeleteSuccessMessage(
        `The event for ${
          deletedEvent?.client || "this client"
        } is deleted.`
      );
     } catch (error) {
        console.error(
          "Failed to delete event:",
          error
        );

        setErrorMessage(
          "Failed to delete the event. Please try again."
        );
      }
  };

  const isPastEvent =
    selectedEvent &&
    selectedEvent.date < today;

  return (
    <Layout>
      <div className="calendar-page">

        {/* Calendar Header */}
        <PageHeader
          icon={<FaCalendarAlt />}
          title="Calendar"
          description="View and manage your event schedule."
          action={
            <div className="calendar-navigation">
              <button
                type="button"
                className="calendar-nav-button"
                onClick={previousMonth}
                aria-label="Previous month"
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                className="today-button"
                onClick={goToToday}
              >
                Today
              </button>

              <div className="calendar-current-month">
                {currentMonth.format("MMMM YYYY")}
              </div>

              <button
                type="button"
                className="calendar-nav-button"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <FaChevronRight />
              </button>
            </div>
          }
        />

        {/* Calendar */}
        <div className="calendar">

          <div className="calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="calendar-grid">
            {days.map((day, index) => {
              const dayEvents =
                getEventsForDay(day);

              return (
                <div
                  className={`calendar-day ${
                    day === null
                      ? "empty-day"
                      : ""
                  } ${
                    day &&
                    currentMonth
                      .date(day)
                      .isSame(dayjs(), "day")
                      ? "today"
                      : ""
                  }`}
                  key={index}
                >
                  {day && (
                    <>
                      <span>{day}</span>

                      <div className="calendar-events">
                        {dayEvents.map((event) => (
                        <button
                          className={`calendar-event ${
                            event.date < today
                              ? "calendar-event-past"
                              : event.date === today
                              ? "calendar-event-today"
                              : "calendar-event-upcoming"
                          }`}
                          key={event._id}
                          onClick={() => setSelectedEvent(event)}
                        >
                            <strong>
                              {event.client}
                            </strong>

                            <small>
                              {event.type} ·{" "}
                              {formatEventTime(event.time)}
                            </small>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div
            className="event-modal-overlay"
            onClick={() =>
              setSelectedEvent(null)
            }
          >
            <div
              className="event-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <button
                className="event-modal-close"
                onClick={() =>
                  setSelectedEvent(null)
                }
              >
                ×
              </button>

              <div className="event-modal-header">
                <div>
                  <span className="event-modal-label">
                    EVENT DETAILS
                  </span>

                  <h2>
                    {selectedEvent.client}
                  </h2>

                  <p>
                    {selectedEvent.type}
                  </p>
                </div>

                <span
                  className={`event-status ${
                    isPastEvent
                      ? "event-status-past"
                      : selectedEvent.date === today
                      ? "event-status-today"
                      : "event-status-upcoming"
                  }`}
                >
                  {isPastEvent
                    ? "Completed"
                    : selectedEvent.date === today
                    ? "Today"
                    : "Upcoming"}
                </span>
              </div>

              <div className="event-detail">
                <strong>Event</strong>
                <span>
                  {selectedEvent.type}
                </span>
              </div>

              <div className="event-detail">
                <strong>Package</strong>
                <span>
                  {selectedEvent.package}
                </span>
              </div>

              <div className="event-detail event-location-detail">
                <strong>Location</strong>

                <span>
                  {selectedEvent.location}
                </span>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedEvent.location
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-maps-button"
                >
                  Open Maps
                </a>
              </div>

              <div className="event-detail">
                <strong>Distance</strong>
                <span>
                  {selectedEvent.distance
                    ? `${selectedEvent.distance} km away`
                    : "Not recorded"}
                </span>
              </div>

              <div className="event-detail">
                <strong>Performers</strong>

                <div className="calendar-performer-tags">
                  {selectedEvent.performers?.length ? (
                    selectedEvent.performers.map((person) => (
                      <span
                        key={person}
                        className="calendar-performer-tag"
                      >
                        {person}
                      </span>
                    ))
                  ) : (
                    <span>None</span>
                  )}
                </div>
              </div>

              <div className="event-detail event-important-detail">
                <strong>Date</strong>

                <span>
                  {dayjs(selectedEvent.date).format("MMMM D, YYYY")}
                </span>
              </div>

              <div className="event-detail event-important-detail">
                <strong>Time</strong>

                <span>
                  {formatEventTime(selectedEvent.time)}
                </span>
              </div>

              <div className="calendar-payment-section">
                <div className="calendar-payment-header">
                  <FaMoneyBillWave />
                  <strong>Payment Information</strong>
                </div>

                <div className="calendar-payment-grid">
                  <div className="calendar-payment-item">
                    <span>Total Amount</span>

                    <strong>
                      ₱
                      {Number(
                        selectedEvent.totalAmount || 0
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div className="calendar-payment-item">
                    <span>Downpayment</span>

                    <strong>
                      ₱
                      {Number(
                        selectedEvent.downpayment || 0
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div className="calendar-payment-item">
                    <span>Balance</span>

                    <strong>
                      ₱
                      {Number(
                        selectedEvent.balance || 0
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div className="calendar-payment-item">
                    <span>Status</span>

                    <strong
                      className={`calendar-payment-status ${
                        selectedEvent.paymentStatus
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")
                      }`}
                    >
                      {selectedEvent.paymentStatus || "Unpaid"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Event Actions */}
              <div className="calendar-event-actions">

                {isPastEvent ? (
                  <div className="past-event-message">
                    This event has been completed
                    and is now part of your event
                    history.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="edit-calendar-event-button"
                      onClick={() => {
                        setEditingEvent(
                          selectedEvent
                        );

                        setSelectedEvent(null);
                      }}
                    >
                      Edit Event
                    </button>

                    <button
                      type="button"
                      className="delete-calendar-event-button"
                      onClick={() =>
                        setDeletingEventId(selectedEvent._id)
                      }
                    >
                      Delete Event
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <EditEvent
            event={editingEvent}
            onClose={() =>
              setEditingEvent(null)
            }
            onUpdateEvent={onUpdateEvent}
          />
        )}

      </div>

      {deletingEventId && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          onConfirm={() =>
            handleDelete(deletingEventId)
          }
          onCancel={() =>
            setDeletingEventId(null)
          }
        />
      )}

      {deleteSuccessMessage && (
        <ConfirmModal
          title="Event Deleted"
          message={deleteSuccessMessage}
          type="success"
          confirmText="OK"
          cancelText=""
          onConfirm={() => setDeleteSuccessMessage("")}
          onCancel={() => setDeleteSuccessMessage("")}
        />
      )}

      {errorMessage && (
        <ConfirmModal
          title="Something Went Wrong"
          message={errorMessage}
          type="error"
          confirmText="OK"
          cancelText=""
          onConfirm={() => setErrorMessage("")}
          onCancel={() => setErrorMessage("")}
        />
      )}
    </Layout>
  );
}

export default Calendar;