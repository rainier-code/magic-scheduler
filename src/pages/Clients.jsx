import { useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import Layout from "../components/layout/Layout";
import EditEvent from "../components/events/EditEvent";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import Toast from "../components/common/Toast";
import { getApiErrorMessage } from "../utils/apiErrors";
import DataLoadError from "../components/common/DataLoadError";

import {
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaTimes,
  FaEdit,
  FaTrash,
  FaMapMarkedAlt,
  FaSearch,
  FaHistory,
  FaMoneyBillWave,
} from "react-icons/fa";

const getEventBalance = (event) =>
  Number(
    event.balance ??
      Math.max(
        (Number(event.totalAmount) || 0) - (Number(event.downpayment) || 0),
        0
      )
  ) || 0;

const formatPeso = (amount) =>
  `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CLIENTS_PER_PAGE = 6;
const BOOKINGS_PER_PAGE = 3;

const getVisiblePageNumbers = (totalPages, currentPage) => {
  const pageCount = Math.min(totalPages, 5);
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - pageCount + 1)
  );

  return Array.from({ length: pageCount }, (_, index) => firstPage + index);
};

function PageControls({ currentPage, totalPages, onPageChange, label }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="clients-pagination" aria-label={label}>
      <span className="clients-pagination-summary">
        Page {currentPage} of {totalPages}
      </span>
      <div className="clients-pagination-controls">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >Previous</button>
        <div className="clients-pagination-numbers">
          {getVisiblePageNumbers(totalPages, currentPage).map((page) => (
            <button
              type="button"
              className="pagination-page-button"
              key={page}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >Next</button>
      </div>
    </nav>
  );
}

function Clients({
  events,
  onUpdateEvent,
  onDeleteEvent,
  eventsLoadError,
  onRetryLoad,
}) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [clientsPage, setClientsPage] = useState(1);
  const [upcomingBookingsPage, setUpcomingBookingsPage] = useState(1);
  const [completedBookingsPage, setCompletedBookingsPage] = useState(1);

  const today = dayjs().format("YYYY-MM-DD");

  // Keep every client in the directory, including clients with only completed bookings.
  const clientsMap = new Map();

  events.forEach((event) => {
    const clientEvents = clientsMap.get(event.client) || [];
    clientEvents.push(event);
    clientsMap.set(event.client, clientEvents);
  });

  const clients = [...clientsMap.entries()].sort(
    ([, eventsA], [, eventsB]) => {
      const upcomingA = eventsA
        .filter((event) => event.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      const upcomingB = eventsB
        .filter((event) => event.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      if (upcomingA.length && !upcomingB.length) return -1;
      if (!upcomingA.length && upcomingB.length) return 1;
      if (upcomingA.length && upcomingB.length) {
        return upcomingA[0].date.localeCompare(upcomingB[0].date) ||
          upcomingA[0].time.localeCompare(upcomingB[0].time);
      }

      const latestA = [...eventsA].sort((a, b) => b.date.localeCompare(a.date))[0];
      const latestB = [...eventsB].sort((a, b) => b.date.localeCompare(a.date))[0];
      return latestB.date.localeCompare(latestA.date);
    }
  );

  // Filter clients using the search box.
  const filteredClients = clients.filter(([clientName]) =>
    clientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  const clientsPageCount = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);
  const safeClientsPage = Math.min(clientsPage, Math.max(clientsPageCount, 1));
  const visibleClients = filteredClients.slice(
    (safeClientsPage - 1) * CLIENTS_PER_PAGE,
    safeClientsPage * CLIENTS_PER_PAGE
  );

  // Get all events belonging to a specific client.
  const getClientEvents = (clientName) => {
    return events.filter(
      (event) => event.client === clientName
    );
  };

  const openClient = (clientName) => {
    const clientEvents = getClientEvents(clientName);

    const upcomingEvents = clientEvents
      .filter((event) => event.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.time.localeCompare(b.time);
      });

    const completedEvents = clientEvents
      .filter((event) => event.date < today)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }

        return b.time.localeCompare(a.time);
      });

    setSelectedClient({
      client: clientName,
      upcomingEvents,
      completedEvents,
    });
    setUpcomingBookingsPage(1);
    setCompletedBookingsPage(1);
  };

  const upcomingBookingPageCount = selectedClient
    ? Math.ceil(selectedClient.upcomingEvents.length / BOOKINGS_PER_PAGE)
    : 0;
  const safeUpcomingBookingsPage = Math.min(
    upcomingBookingsPage,
    Math.max(upcomingBookingPageCount, 1)
  );
  const completedBookingPageCount = selectedClient
    ? Math.ceil(selectedClient.completedEvents.length / BOOKINGS_PER_PAGE)
    : 0;
  const safeCompletedBookingsPage = Math.min(
    completedBookingsPage,
    Math.max(completedBookingPageCount, 1)
  );

  const handleDelete = async (eventId) => {
    try {
      const deletedEvent = events.find(
        (event) => event._id === eventId
      );

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/events/${eventId}`
      );

      setSelectedClient(null);
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

  const handleEdit = (event) => {
    setSelectedClient(null);
    setEditingEvent(event);
  };

  const handleClientKeyDown = (
    e,
    clientName
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openClient(clientName);
    }
  };

  const selectedClientEvents = selectedClient
    ? [...selectedClient.upcomingEvents, ...selectedClient.completedEvents]
    : [];
  const selectedClientOutstandingBalance = selectedClientEvents.reduce(
    (total, event) => total + getEventBalance(event),
    0
  );
  const eventPendingDeletion = events.find(
    (event) => event._id === deletingEventId
  );

  return (
    <Layout>
      <PageHeader
        icon={<FaUsers />}
        title="Clients"
        description="Client profiles and their complete booking history."
      />

      <DataLoadError message={eventsLoadError} onRetry={onRetryLoad} />

      <section className="clients-section">
        <div className="clients-section-header">
          <div>
            <h2>All Clients</h2>

            <p>
              Upcoming bookings and completed records in one place.
            </p>
          </div>

          <span className="clients-count">
            {filteredClients.length} client
            {filteredClients.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search Clients */}
        <div className="clients-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search all clients..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setClientsPage(1);
            }}
            aria-label="Search clients"
          />

          {searchTerm && (
            <button
              type="button"
              className="clients-search-clear"
              onClick={() => {
                setSearchTerm("");
                setClientsPage(1);
              }}
              aria-label="Clear client search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="empty-clients">
            <FaUsers />

            <h3>No clients yet</h3>

            <p>
              Add a booking to create a client profile and booking history.
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="empty-clients">
            <FaSearch />

            <h3>No clients found</h3>

            <p>
              No client matches "{searchTerm}".
            </p>

            <button
              type="button"
              className="clear-client-search-button"
              onClick={() => {
                setSearchTerm("");
                setClientsPage(1);
              }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="client-grid">
            {visibleClients.map(
              ([clientName, clientEvents]) => {
                const sortedClientEvents = [
                  ...clientEvents,
                ].sort((a, b) => {
                  if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                  }

                  return a.time.localeCompare(b.time);
                });
                const upcomingClientEvents = sortedClientEvents.filter(
                  (event) => event.date >= today
                );
                const completedClientEvents = sortedClientEvents.filter(
                  (event) => event.date < today
                );
                const highlightedEvent = upcomingClientEvents[0] ||
                  completedClientEvents[completedClientEvents.length - 1];
                const outstandingBalance = clientEvents.reduce(
                  (total, event) => total + getEventBalance(event),
                  0
                );

                return (
                  <div
                    className="client-card"
                    key={clientName}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      openClient(clientName)
                    }
                    onKeyDown={(e) =>
                      handleClientKeyDown(
                        e,
                        clientName
                      )
                    }
                  >
                  <div className="client-card-header">
                    <div className="client-avatar">
                      {clientName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="client-card-name">
                      <h3>{clientName}</h3>

                      <span>
                        {clientEvents.length} booking{clientEvents.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div
                      className={`client-payment-badge ${outstandingBalance > 0 ? "unpaid" : "fully-paid"}`}
                    >
                      <span className="client-payment-dot"></span>
                      {outstandingBalance > 0
                        ? `${formatPeso(outstandingBalance)} due`
                        : "Paid in full"}
                    </div>
                  </div>

                    <div className="client-card-booking-counts">
                      <span><FaCalendarAlt /> {upcomingClientEvents.length} upcoming</span>
                      <span><FaHistory /> {completedClientEvents.length} completed</span>
                    </div>

                    {highlightedEvent && (
                      <div className="client-event client-event-preview">
                        <span className="client-event-preview-label">
                          {upcomingClientEvents.length ? "Next booking" : "Most recent booking"}
                        </span>
                        <strong>{highlightedEvent.type}</strong>
                        <p>
                          <FaCalendarAlt />
                          {dayjs(highlightedEvent.date).format("MMM D, YYYY")} · {highlightedEvent.time}
                        </p>
                        <p>
                          <FaMapMarkerAlt />
                          <span>{highlightedEvent.location}</span>
                        </p>
                      </div>
                    )}

                    <div className="client-card-view">
                      Open profile and booking history
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {clients.length > 0 && (
          <PageControls
            currentPage={safeClientsPage}
            totalPages={clientsPageCount}
            onPageChange={setClientsPage}
            label="Client directory pages"
          />
        )}
      </section>

      {selectedClient && (
        <div
          className="client-modal-overlay"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="client-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="client-modal-close"
              onClick={() => setSelectedClient(null)}
            >
              <FaTimes />
            </button>

            <div className="client-modal-title">
              <div className="client-avatar">
                {selectedClient.client
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2>{selectedClient.client}</h2>
                <p>Complete booking history and payment overview</p>
              </div>
            </div>

            <div className="client-profile-summary">
              <div>
                <strong>{selectedClientEvents.length}</strong>
                <span>Total bookings</span>
              </div>
              <div>
                <strong>{selectedClient.upcomingEvents.length}</strong>
                <span>Upcoming</span>
              </div>
              <div>
                <strong>{selectedClient.completedEvents.length}</strong>
                <span>Completed</span>
              </div>
              <div className={selectedClientOutstandingBalance > 0 ? "due" : "paid"}>
                <strong>{formatPeso(selectedClientOutstandingBalance)}</strong>
                <span>Balance due</span>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="client-modal-events">
              <div className="client-modal-section-title">
                <FaCalendarAlt />
                <h3>Upcoming Events</h3>
              </div>

              {selectedClient.upcomingEvents.length === 0 ? (
                <div className="client-no-events">
                  No upcoming events for this client.
                </div>
              ) : (
                selectedClient.upcomingEvents
                  .slice(
                    (safeUpcomingBookingsPage - 1) * BOOKINGS_PER_PAGE,
                    safeUpcomingBookingsPage * BOOKINGS_PER_PAGE
                  )
                  .map((event) => (
                  <div
                    className="client-history-card"
                    key={event._id}
                  >
                    <div className="history-top">
                      <div>
                        <h4>{event.type}</h4>
                      </div>

                      <span>
                        {dayjs(event.date).format(
                          "MMMM D, YYYY"
                        )}
                      </span>
                    </div>

                    <div className="history-details">
                      <div>
                        <FaCalendarAlt />

                        <span>
                          {dayjs(event.date).format(
                            "MMMM D, YYYY"
                          )}
                        </span>
                      </div>

                      <div>
                        <FaClock />

                        <span>{event.time}</span>
                      </div>

                      <div>
                        <FaMapMarkerAlt />

                        <span>{event.location}</span>
                      </div>

                      <div>
                        <FaBoxOpen />

                        <span>{event.package}</span>
                      </div>

                      <div>
                        <FaUsers />

                        <span>
                          {event.performers?.length > 0
                            ? event.performers.join(", ")
                            : "No performers"}
                        </span>
                      </div>

                      {event.distance && (
                        <div>
                          <FaMapMarkerAlt />

                          <span>
                            {event.distance} km away
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="client-payment">
                      <div className="client-payment-header">
                        <FaMoneyBillWave />
                        <strong>Payment Information</strong>
                      </div>

                      <div className="client-payment-grid">
                        <div>
                          <span>Total Amount</span>
                          <strong>
                            ₱
                            {Number(event.totalAmount || 0).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Downpayment</span>
                          <strong>
                            ₱
                            {Number(event.downpayment || 0).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Balance</span>
                          <strong>
                            ₱
                            {Number(event.balance || 0).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <strong
                            className={`client-payment-status ${
                              event.paymentStatus
                                ?.toLowerCase()
                                .replace(/\s+/g, "-")
                            }`}
                          >
                            {event.paymentStatus || "Unpaid"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="client-modal-map">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          event.location
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="client-modal-map-button"
                      >
                        <FaMapMarkedAlt />
                        Open in Google Maps
                      </a>
                    </div>

                    <div className="client-modal-event-actions">
                      <button
                        type="button"
                        className="client-modal-edit-button"
                        onClick={() =>
                          handleEdit(event)
                        }
                      >
                        <FaEdit />
                        Edit Event
                      </button>

                      <button
                        type="button"
                        className="client-modal-delete-button"
                        onClick={() => setDeletingEventId(event._id)}
                      >
                        <FaTrash />
                        Delete Event
                      </button>
                    </div>
                  </div>
                  ))
              )}

              <PageControls
                currentPage={safeUpcomingBookingsPage}
                totalPages={upcomingBookingPageCount}
                onPageChange={setUpcomingBookingsPage}
                label="Upcoming booking pages"
              />
            </div>

            {/* Completed Events */}
            <div className="client-modal-events client-completed-events">
              <div className="client-modal-section-title">
                <FaHistory />
                <h3>Completed Events</h3>
              </div>

              {selectedClient.completedEvents.length === 0 ? (
                <div className="client-no-events">
                  No completed events for this client.
                </div>
              ) : (
                selectedClient.completedEvents
                  .slice(
                    (safeCompletedBookingsPage - 1) * BOOKINGS_PER_PAGE,
                    safeCompletedBookingsPage * BOOKINGS_PER_PAGE
                  )
                  .map((event) => (
                  <div
                    className="client-history-card client-completed-card"
                    key={event._id}
                  >
                    <div className="history-top">
                      <div>
                        <h4>{event.type}</h4>
                      </div>

                      <span>
                        {dayjs(event.date).format(
                          "MMMM D, YYYY"
                        )}
                      </span>
                    </div>

                    <div className="history-details">
                      <div>
                        <FaCalendarAlt />

                        <span>
                          {dayjs(event.date).format(
                            "MMMM D, YYYY"
                          )}
                        </span>
                      </div>

                      <div>
                        <FaClock />

                        <span>{event.time}</span>
                      </div>

                      <div>
                        <FaMapMarkerAlt />

                        <span>{event.location}</span>
                      </div>

                      <div>
                        <FaBoxOpen />

                        <span>{event.package}</span>
                      </div>

                      <div>
                        <FaUsers />

                        <span>
                          {event.performers?.length > 0
                            ? event.performers.join(", ")
                            : "No performers"}
                        </span>
                      </div>

                      {event.distance && (
                        <div>
                          <FaMapMarkerAlt />

                          <span>
                            {event.distance} km away
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="client-completed-label">
                      <FaHistory />
                      Completed Event
                    </div>

                    <div className="client-record-payment">
                      <span><FaMoneyBillWave /> Balance due</span>
                      <strong>{formatPeso(getEventBalance(event))}</strong>
                      <span className={`client-record-payment-status ${getEventBalance(event) > 0 ? "due" : "paid"}`}>
                        {event.paymentStatus || (getEventBalance(event) > 0 ? "Outstanding" : "Paid in full")}
                      </span>
                    </div>
                  </div>
                  ))
              )}

              <PageControls
                currentPage={safeCompletedBookingsPage}
                totalPages={completedBookingPageCount}
                onPageChange={setCompletedBookingsPage}
                label="Completed booking pages"
              />
            </div>
          </div>
        </div>
      )}

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

      {deletingEventId && (
        <ConfirmModal
          title="Delete this booking?"
          message={eventPendingDeletion
            ? `${eventPendingDeletion.client} · ${eventPendingDeletion.type} · ${dayjs(eventPendingDeletion.date).format("MMMM D, YYYY")} at ${eventPendingDeletion.time}. Deleting it cannot be undone.`
            : "This booking will be permanently deleted."}
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

export default Clients;
