import { useEffect, useState } from "react";
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
import Toast from "../components/common/Toast";
import { getApiErrorMessage } from "../utils/apiErrors";
import DataLoadError from "../components/common/DataLoadError";

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

const UPCOMING_EVENTS_PER_PAGE = 3;

const getPageNumbers = (totalPages, currentPage) => {
  const visibleCount = Math.min(totalPages, 5);
  const startPage = Math.max(
    1,
    Math.min(currentPage - 1, totalPages - visibleCount + 1)
  );

  return Array.from({ length: visibleCount }, (_, index) => startPage + index);
};

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
  eventsLoadError,
  onRetryLoad,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [isAddButtonObscured, setIsAddButtonObscured] = useState(false);

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

  const upcomingPageCount = Math.ceil(
    upcomingEvents.length / UPCOMING_EVENTS_PER_PAGE
  );

  useEffect(() => {
    const pagination = document.querySelector(".upcoming-pagination");
    setIsAddButtonObscured(false);

    if (!pagination || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsAddButtonObscured(entry.isIntersecting),
      { rootMargin: "-70% 0px 0px 0px" }
    );

    observer.observe(pagination);
    return () => observer.disconnect();
  }, [upcomingPageCount]);
  const safeUpcomingPage = Math.min(
    upcomingPage,
    Math.max(upcomingPageCount, 1)
  );
  const visibleUpcomingEvents = upcomingEvents.slice(
    (safeUpcomingPage - 1) * UPCOMING_EVENTS_PER_PAGE,
    safeUpcomingPage * UPCOMING_EVENTS_PER_PAGE
  );

  // The next upcoming event
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  const daysUntilNextEvent = nextEvent
    ? dayjs(nextEvent.date).diff(dayjs().startOf("day"), "day")
    : null;

  // Unique clients
  const totalClients = new Set(events.map((event) => event.client)).size;

  const handleDelete = async (eventId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`
      );

      const deletedEvent = events.find((event) => event._id === eventId);

      onDeleteEvent(eventId);
      setDeletingEventId(null);

      setDeleteSuccessMessage(
        `The event for ${deletedEvent?.client || "this client"} is deleted.`
      );
    } catch (error) {
      console.error("Failed to delete event:", error);

      setErrorMessage(getApiErrorMessage(error, "Failed to delete the event."));
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
  };

  const eventPendingDeletion = events.find(
    (event) => event._id === deletingEventId
  );

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

      {!isLoadingEvents && <DataLoadError message={eventsLoadError} onRetry={onRetryLoad} />}

      {isLoadingEvents ? (
        <div className="dashboard-skeleton" aria-label="Loading your schedule" role="status" aria-busy="true">
          <span className="sr-only">Loading your schedule…</span>
          <div className="dashboard-skeleton-stats">
            {Array.from({ length: 4 }, (_, index) => <div className="skeleton-block skeleton-stat" key={index} />)}
          </div>
          <div className="dashboard-skeleton-featured">
            {Array.from({ length: 2 }, (_, index) => <div className="skeleton-block skeleton-featured" key={index} />)}
          </div>
          <div className="skeleton-block skeleton-upcoming-title" />
          <div className="dashboard-skeleton-upcoming">
            {Array.from({ length: 3 }, (_, index) => <div className="skeleton-block skeleton-upcoming-card" key={index} />)}
          </div>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <section className="cards dashboard-statistics" aria-label="Schedule statistics">
            <div className="card">
              <div className="card-top">
                <div className="card-icon blue">
                  <FaCalendarCheck />
                </div>
                <span className="card-label">ALL TIME</span>
              </div>
              <div className="card-content">
                <h2>{events.length}</h2>
                <p>Total Events</p>
                <small className="card-hint">Across your schedule</small>
              </div>
            </div>

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

          </section>

          <div className="dashboard-event-overview">
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
          </div>

          {/* UPCOMING */}
          <section className="events upcoming-events-section">
            <div className="section-title-row">
              <div>
                <h2>Upcoming Events</h2>

                <p>Coming up next, sorted by date and time.</p>
              </div>
              <span className="section-count">
                {upcomingEvents.length} event{upcomingEvents.length !== 1 ? "s" : ""}
              </span>
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
              <>
                <div className="upcoming-event-grid">
                  {visibleUpcomingEvents.map(renderEventCard)}
                </div>

                {upcomingPageCount > 1 && (
                  <nav className="upcoming-pagination" aria-label="Upcoming event pages">
                    <span className="upcoming-pagination-summary">
                      Showing {(safeUpcomingPage - 1) * UPCOMING_EVENTS_PER_PAGE + 1}
                      –{Math.min(safeUpcomingPage * UPCOMING_EVENTS_PER_PAGE, upcomingEvents.length)}
                      {" of "}{upcomingEvents.length}
                    </span>

                    <div className="upcoming-pagination-controls">
                      <button
                        type="button"
                        aria-label="Previous page"
                        onClick={() => setUpcomingPage(safeUpcomingPage - 1)}
                        disabled={safeUpcomingPage === 1}
                      >
                        Previous
                      </button>

                      {getPageNumbers(upcomingPageCount, safeUpcomingPage).map((page) => (
                        <button
                          type="button"
                          className="pagination-page-button"
                          key={page}
                          aria-label={`Page ${page}`}
                          aria-current={safeUpcomingPage === page ? "page" : undefined}
                          onClick={() => setUpcomingPage(page)}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        aria-label="Next page"
                        onClick={() => setUpcomingPage(safeUpcomingPage + 1)}
                        disabled={safeUpcomingPage === upcomingPageCount}
                      >
                        Next
                      </button>
                    </div>
                  </nav>
                )}
              </>
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

            setToastMessage(
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
          onSuccess={setToastMessage}
        />
      )}

      <button
        type="button"
        className={`floating-add-event ${isAddButtonObscured ? "is-obscured" : ""}`}
        onClick={() => setShowAddEvent(true)}
        aria-label="Add event"
        title="Add event"
      >
        <FaPlus aria-hidden="true" />
        <span>Add Event</span>
      </button>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {deletingEventId && (
        <ConfirmModal
          title="Delete this booking?"
          message={`${eventPendingDeletion?.client || "This booking"} · ${eventPendingDeletion?.type || "Event"} · ${formatEventDate(eventPendingDeletion?.date)} at ${formatEventTime(eventPendingDeletion?.time)}. Deleting it cannot be undone.`}
          confirmText="Delete Booking"
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
