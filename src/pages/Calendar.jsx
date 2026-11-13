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
import Toast from "../components/common/Toast";
import { getApiErrorMessage } from "../utils/apiErrors";
import DataLoadError from "../components/common/DataLoadError";

const formatEventTime = (time) => {
  if (!time) return "";

  return dayjs(`2000-01-01 ${time}`).format("h:mm A");
};

function Calendar({
  events,
  onUpdateEvent,
  onDeleteEvent,
  eventsLoadError,
  onRetryLoad,
}) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = startOfMonth.day();
  const monthEvents = events.filter(
    (event) => dayjs(event.date).format("YYYY-MM") === currentMonth.format("YYYY-MM")
  );

  const days = [];

  // Empty spaces before the first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const previousMonth = () => {
    const month = currentMonth.subtract(1, "month");
    setCurrentMonth(month);
    setSelectedDate(month.startOf("month").format("YYYY-MM-DD"));
  };

  const nextMonth = () => {
    const month = currentMonth.add(1, "month");
    setCurrentMonth(month);
    setSelectedDate(month.startOf("month").format("YYYY-MM-DD"));
  };

  const goToToday = () => {
    const todayDate = dayjs();
    setCurrentMonth(todayDate);
    setSelectedDate(todayDate.format("YYYY-MM-DD"));
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

  const selectedDayEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleDelete = async (eventId) => {
    try {
      const deletedEvent = events.find(
        (event) => event._id === eventId
      );

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`
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

        setErrorMessage(getApiErrorMessage(error, "Failed to delete the event."));
      }
  };

  const isPastEvent =
    selectedEvent &&
    selectedEvent.date < today;

  const eventPendingDeletion = events.find(
    (event) => event._id === deletingEventId
  );

  return (
    <Layout>
      <div className="calendar-page">

        {/* Calendar Header */}
        <PageHeader
          icon={<FaCalendarAlt />}
          title="Calendar"
          description="View and manage your event schedule."
          action={
            <div className="calendar-navigation" role="group" aria-label="Calendar navigation">
              <div className="calendar-month-controls">
              <button
                type="button"
                className="calendar-nav-button"
                onClick={previousMonth}
                aria-label="Previous month"
              >
                <FaChevronLeft />
              </button>

              <div className="calendar-current-month" aria-live="polite">
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

              <button
                type="button"
                className="today-button"
                onClick={goToToday}
                disabled={currentMonth.isSame(dayjs(), "month") && selectedDate === today}
              >
                Today
              </button>
            </div>
          }
        />

        <DataLoadError message={eventsLoadError} onRetry={onRetryLoad} />

        <div className="calendar-overview">
          <p>
            <strong>{monthEvents.length}</strong> event{monthEvents.length !== 1 ? "s" : ""} this month
          </p>
          <div className="calendar-legend" aria-label="Event status colors">
            <span className="upcoming">Upcoming</span>
            <span className="today">Today</span>
            <span className="past">Past</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="calendar" role="region" aria-label={`${currentMonth.format("MMMM YYYY")} calendar`}>

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
                  } ${
                    day && currentMonth.date(day).format("YYYY-MM-DD") === selectedDate
                      ? "selected"
                      : ""
                  }`}
                  key={index}
                >
                  {day && (
                    <>
                      <div className="calendar-day-heading">
                        <button
                          type="button"
                          className="calendar-day-select"
                          aria-pressed={currentMonth.date(day).format("YYYY-MM-DD") === selectedDate}
                          aria-label={`${currentMonth.date(day).format("MMMM D")}, ${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}`}
                          onClick={() => setSelectedDate(currentMonth.date(day).format("YYYY-MM-DD"))}
                        >
                          {day}
                        </button>
                        {dayEvents.length > 0 && (
                          <span className="calendar-day-count" aria-hidden="true">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="calendar-events">
                        {dayEvents.map((event) => (
                        <button
                          type="button"
                          aria-label={`${event.client}, ${event.type}, ${formatEventTime(event.time)}`}
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
                              {formatEventTime(event.time)} · {event.type}
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

        <section className="calendar-agenda" aria-live="polite">
          <div className="calendar-agenda-heading">
            <div>
              <h2>{dayjs(selectedDate).format("MMMM D, YYYY")}</h2>
              <p>{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>
          {selectedDayEvents.length ? (
            <div className="calendar-agenda-list">
              {selectedDayEvents.map((event) => (
                <button
                  type="button"
                  className={`calendar-agenda-item ${event.date < today ? "past" : event.date === today ? "today" : "upcoming"}`}
                  key={event._id}
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className="calendar-agenda-time">{formatEventTime(event.time)}</span>
                  <span className="calendar-agenda-copy">
                    <strong>{event.client}</strong>
                    <small>{event.type} · {event.location}</small>
                  </span>
                  <FaChevronRight />
                </button>
              ))}
            </div>
          ) : (
            <p className="calendar-agenda-empty">No events scheduled for this day.</p>
          )}
        </section>

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
            onSuccess={setToastMessage}
          />
        )}

      </div>

      {deletingEventId && (
        <ConfirmModal
          title="Delete this booking?"
          message={`${eventPendingDeletion?.client || "This booking"} · ${eventPendingDeletion?.type || "Event"} · ${dayjs(eventPendingDeletion?.date).format("MMMM D, YYYY")} at ${formatEventTime(eventPendingDeletion?.time)}. Deleting it cannot be undone.`}
          confirmText="Delete Booking"
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
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </Layout>
  );
}

export default Calendar;
