import { useState } from "react";
import dayjs from "dayjs";
import Layout from "../components/layout/Layout";
import {
  FaCalendarCheck,
  FaClock,
  FaUsers,
  FaMagic,
  FaMapMarkerAlt,
  FaMapMarkedAlt,
  FaArrowRight,
  FaPlus,
  FaMoneyBillWave,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import AddEvent from "../components/events/AddEvent";
import axios from "axios";
import EditEvent from "../components/events/EditEvent";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";

const formatEventTime = (time) => {
  if (!time) return "";

  return dayjs(`2000-01-01 ${time}`).format("h:mm A");
};

// Month, day, year  ->  October 5, 2026
const formatEventDate = (date) => {
  if (!date) return "";

  return dayjs(date).format("MMMM D, YYYY");
};

const formatPeso = (amount) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getPaymentClass = (status) =>
  (status || "Unpaid").toLowerCase().replace(/\s+/g, "-");

// Short "starts in" text for events happening today
const getTimeUntil = (date, time) => {
  if (!date || !time) return "";

  const minutes = dayjs(`${date} ${time}`).diff(dayjs(), "minute");

  if (minutes < 0) return "Already started";
  if (minutes < 60) return `Starts in ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `Starts in ${hours} hr${hours > 1 ? "s" : ""}${
    rest ? ` ${rest} min` : ""
  }`;
};

function Dashboard({
  events,
  isLoadingEvents,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  // Events happening today
  const todaysEvents = events.filter((event) => event.date === today);

  const sortedTodaysEvents = [...todaysEvents].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  // Future events only
  const upcomingEvents = events
    .filter((event) => event.date > today)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }

      return a.time.localeCompare(b.time);
    });

  // The next upcoming event
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  const daysUntilNextEvent = nextEvent
    ? dayjs(nextEvent.date).diff(dayjs().startOf("day"), "day")
    : null;

  // Unique clients
  const totalClients = new Set(events.map((event) => event.client)).size;

  const handleDelete = async (eventId) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`);

      const deletedEvent = events.find((event) => event._id === eventId);

      onDeleteEvent(eventId);
      setDeletingEventId(null);

      setDeleteSuccessMessage(
        `The event for ${deletedEvent?.client || "this client"} is deleted.`
      );
    } catch (error) {
      console.error("Failed to delete event:", error);

      setErrorMessage("Failed to delete the event. Please try again.");
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
  };

  /*
    DETAILED CARD
    Used by "Today's Schedule" and "Next Event" so both look the same.
  */
  const renderDetailedCard = (
    event,
    { label, statusLabel, statusText, showActions = false }
  ) => (
    <div className="next-event-card" key={event._id}>
      <div className="next-event-main">
        <div className="next-event-icon">
          <FaCalendarCheck />
        </div>

        <div className="next-event-info">
          <span className="next-event-label">{label}</span>

          <h3>{event.client}</h3>

          <p className="next-event-type">{event.type}</p>

          <div className="next-event-status">
            <span className="next-event-status-label">{statusLabel}</span>

            <span className="next-event-countdown">{statusText}</span>
          </div>
        </div>
      </div>

      <div className="next-event-details">
        <div className="next-event-detail">
          <FaCalendarCheck />

          <div>
            <small>Date</small>
            <strong>{formatEventDate(event.date)}</strong>
          </div>
        </div>

        <div className="next-event-detail">
          <FaClock />

          <div>
            <small>Time</small>
            <strong>{formatEventTime(event.time)}</strong>
          </div>
        </div>

        <div className="next-event-detail">
          <FaMapMarkerAlt />

          <div>
            <small>Location</small>
            <strong>{event.location}</strong>

            {event.distance && <span>{event.distance} km away</span>}

            {event.source && <span>Source: {event.source}</span>}
          </div>
        </div>

        <div className="next-event-detail">
          <FaUsers />

          <div>
            <small>Performers</small>
            <strong>
              {event.performers?.length
                ? event.performers.join(", ")
                : "No performers listed"}
            </strong>
          </div>
        </div>

        <div className="next-event-detail">
          <FaMagic />

          <div>
            <small>Package</small>
            <strong>{event.package || "Not specified"}</strong>
          </div>
        </div>
      </div>

      <div className="next-event-payment">
        <div className="next-event-payment-header">
          <FaMoneyBillWave />
          <strong>Payment Information</strong>
        </div>

        <div className="next-event-payment-grid">
          <div>
            <span>Total Amount</span>
            <strong>{formatPeso(event.totalAmount)}</strong>
          </div>

          <div>
            <span>Downpayment</span>
            <strong>{formatPeso(event.downpayment)}</strong>
          </div>

          <div>
            <span>Balance</span>
            <strong>{formatPeso(event.balance)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong
              className={`next-event-payment-status ${getPaymentClass(
                event.paymentStatus
              )}`}
            >
              {event.paymentStatus || "Unpaid"}
            </strong>
          </div>
        </div>
      </div>

      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          event.location
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="next-event-map-button"
        title="Open the event location in Google Maps"
      >
        <FaMapMarkedAlt />
        Open Maps
        <FaArrowRight />
      </a>

      {showActions && (
        <div className="event-actions dashboard-card-actions">
          <button
            type="button"
            className="edit-event-button"
            onClick={() => handleEdit(event)}
            title="Change the details of this event"
          >
            <FaEdit />
            Edit Event
          </button>

          <button
            type="button"
            className="delete-event-button"
            onClick={() => setDeletingEventId(event._id)}
            title="Remove this event"
          >
            <FaTrash />
            Delete Event
          </button>
        </div>
      )}
    </div>
  );

  // Compact card used by "Upcoming Events"
  const renderEventCard = (event) => {
    return (
      <div className="event-card" key={event._id}>
        <div className="event-top">
          <div>
            <h3>{event.client}</h3>
            <p>{event.type}</p>
          </div>

          <div className="event-time">
            <span>{formatEventDate(event.date)}</span>
            <span>{formatEventTime(event.time)}</span>
          </div>
        </div>

        <div className="event-meta">
          {event.package && (
            <span>
              <strong>Package:</strong> {event.package}
            </span>
          )}

          {event.source && (
            <span>
              <strong>Source:</strong> {event.source}
            </span>
          )}
        </div>

        <div className="location">
          <FaMapMarkerAlt />

          <div className="location-info">
            <span>{event.location}</span>

            {event.distance && <small>{event.distance} km away</small>}
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              event.location
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="maps-button"
            title="Open the event location in Google Maps"
          >
            <FaMapMarkedAlt />
            Open Maps
          </a>
        </div>

        <div className="performers">
          {event.performers?.map((person) => (
            <span key={person} className="performer-tag">
              {person}
            </span>
          ))}
        </div>

        <div className="event-payment">
          <div className="event-payment-header">
            <FaMoneyBillWave />
            <strong>Payment Information</strong>
          </div>

          <div className="event-payment-grid">
            <div>
              <span>Total Amount</span>
              <strong>{formatPeso(event.totalAmount)}</strong>
            </div>

            <div>
              <span>Downpayment</span>
              <strong>{formatPeso(event.downpayment)}</strong>
            </div>

            <div>
              <span>Balance</span>
              <strong>{formatPeso(event.balance)}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong
                className={`payment-status ${getPaymentClass(
                  event.paymentStatus
                )}`}
              >
                {event.paymentStatus || "Unpaid"}
              </strong>
            </div>
          </div>
        </div>

        <div className="event-actions">
          <button
            type="button"
            className="edit-event-button"
            onClick={() => handleEdit(event)}
            title="Change the details of this event"
          >
            Edit Event
          </button>

          <button
            type="button"
            className="delete-event-button"
            onClick={() => setDeletingEventId(event._id)}
            title="Remove this event"
          >
            Delete Event
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageHeader
        icon={<FaCalendarCheck />}
        title="Dashboard"
        description="Your bookings at a glance. Use Add Event to schedule a new one."
        action={
          <button
            type="button"
            className="add-event-primary-button"
            onClick={() => setShowAddEvent(true)}
          >
            <FaPlus />
            Add Event
          </button>
        }
      />

      {isLoadingEvents ? (
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>

          <h3>Loading your schedule...</h3>

          <p>Getting your events.</p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="cards">
            <div className="card">
              <div className="card-top">
                <div className="card-icon blue">
                  <FaCalendarCheck />
                </div>

                <span className="card-label">TODAY</span>
              </div>

              <div className="card-content">
                <h2>{todaysEvents.length}</h2>
                <p>Today's Events</p>
                <small className="card-hint">Happening today</small>
              </div>
            </div>

            <div className="card">
              <div className="card-top">
                <div className="card-icon green">
                  <FaClock />
                </div>

                <span className="card-label">SCHEDULE</span>
              </div>

              <div className="card-content">
                <h2>{upcomingEvents.length}</h2>
                <p>Upcoming Events</p>
                <small className="card-hint">Booked after today</small>
              </div>
            </div>

            <div className="card">
              <div className="card-top">
                <div className="card-icon purple">
                  <FaUsers />
                </div>

                <span className="card-label">CLIENTS</span>
              </div>

              <div className="card-content">
                <h2>{totalClients}</h2>
                <p>Total Clients</p>
                <small className="card-hint">Different people booked</small>
              </div>
            </div>
          </div>

          {/* TODAY */}
          <section className="next-event-section today-section">
            <div className="section-title-row">
              <div>
                <h2>Today's Schedule</h2>
                <p>Events happening today, earliest first.</p>
              </div>

              {sortedTodaysEvents.length > 0 && (
                <span className="section-count">
                  {sortedTodaysEvents.length} event
                  {sortedTodaysEvents.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {sortedTodaysEvents.length === 0 ? (
              <div className="next-event-empty">
                <FaCalendarCheck />

                <div>
                  <h3>No events today</h3>

                  <p>Your schedule is clear. Enjoy the free time!</p>
                </div>
              </div>
            ) : (
              <div className="dashboard-card-list">
                {sortedTodaysEvents.map((event) =>
                  renderDetailedCard(event, {
                    label: "TODAY'S PERFORMANCE",
                    statusLabel: "TODAY",
                    statusText: getTimeUntil(event.date, event.time),
                    showActions: true,
                  })
                )}
              </div>
            )}
          </section>

          {/* NEXT EVENT */}
          <section className="next-event-section">
            <div className="section-title-row">
              <div>
                <h2>Next Event</h2>
                <p>Your nearest upcoming performance.</p>
              </div>
            </div>

            {nextEvent ? (
              renderDetailedCard(nextEvent, {
                label: "NEXT PERFORMANCE",
                statusLabel: "UPCOMING",
                statusText:
                  daysUntilNextEvent === 1
                    ? "Tomorrow"
                    : `In ${daysUntilNextEvent} days`,
              })
            ) : (
              <div className="next-event-empty">
                <FaCalendarCheck />

                <div>
                  <h3>No upcoming events</h3>

                  <p>Add a future event and it will show up here.</p>
                </div>
              </div>
            )}
          </section>

          {/* UPCOMING */}
          <section className="events upcoming-events-section">
            <div className="section-title-row">
              <div>
                <h2>Upcoming Events</h2>

                <p>
                  {upcomingEvents.length} upcoming event
                  {upcomingEvents.length !== 1 ? "s" : ""}, earliest first.
                </p>
              </div>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="empty-schedule">
                <h3>No upcoming events.</h3>

                <p>Book your next event to see it listed here.</p>

                <button
                  type="button"
                  className="add-event-primary-button empty-add-button"
                  onClick={() => setShowAddEvent(true)}
                >
                  <FaPlus />
                  Add Event
                </button>
              </div>
            ) : (
              upcomingEvents.map(renderEventCard)
            )}
          </section>
        </>
      )}

      {/* ADD EVENT */}
      {showAddEvent && (
        <AddEvent
          onClose={() => setShowAddEvent(false)}
          onAddEvent={(newEvent) => {
            onAddEvent(newEvent);

            setAddSuccessMessage(
              `The event for ${newEvent.client} has been added successfully.`
            );
          }}
        />
      )}

      {/* EDIT EVENT */}
      {editingEvent && (
        <EditEvent
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdateEvent={onUpdateEvent}
        />
      )}

      {deletingEventId && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          onConfirm={() => handleDelete(deletingEventId)}
          onCancel={() => setDeletingEventId(null)}
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

      {addSuccessMessage && (
        <ConfirmModal
          title="Event Added Successfully"
          message={addSuccessMessage}
          type="success"
          confirmText="OK"
          cancelText=""
          onConfirm={() => setAddSuccessMessage("")}
          onCancel={() => setAddSuccessMessage("")}
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

export default Dashboard;
