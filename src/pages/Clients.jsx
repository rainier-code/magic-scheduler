import { useState } from "react";
import dayjs from "dayjs";
import axios from "axios";
import Layout from "../components/layout/Layout";
import EditEvent from "../components/events/EditEvent";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";

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

function Clients({
  events,
  onUpdateEvent,
  onDeleteEvent,
}) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  // Only today's and future events appear in the main Clients list.
  const activeEvents = events.filter(
    (event) => event.date >= today
  );

  // Group active events by client.
  const clientsMap = {};

  activeEvents.forEach((event) => {
    if (!clientsMap[event.client]) {
      clientsMap[event.client] = [];
    }

    clientsMap[event.client].push(event);
  });

  const clients = Object.entries(clientsMap).sort(
    ([, eventsA], [, eventsB]) => {
      const nearestA = [...eventsA].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.time.localeCompare(b.time);
      })[0];

      const nearestB = [...eventsB].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.time.localeCompare(b.time);
      })[0];

      if (nearestA.date !== nearestB.date) {
        return nearestA.date.localeCompare(nearestB.date);
      }

      return nearestA.time.localeCompare(nearestB.time);
    }
  );

  // Filter clients using the search box.
  const filteredClients = clients.filter(([clientName]) =>
    clientName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
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
  };

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

      setErrorMessage(
        "Failed to delete the event. Please try again."
      );
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

  return (
    <Layout>
    <PageHeader
      icon={<FaUsers />}
      title="Clients"
      description="View and manage your current and upcoming client events."
    />

      <section className="clients-section">
        <div className="clients-section-header">
          <div>
            <h2>Active Clients</h2>

            <p>
              Clients with today's or upcoming events.
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
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            aria-label="Search clients"
          />

          {searchTerm && (
            <button
              type="button"
              className="clients-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear client search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="empty-clients">
            <FaUsers />

            <h3>No active clients</h3>

            <p>
              Clients with today's or upcoming events
              will appear here.
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="empty-clients">
            <FaSearch />

            <h3>No clients found</h3>

            <p>
              No active client matches "{searchTerm}".
            </p>

            <button
              type="button"
              className="clear-client-search-button"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="client-grid">
            {filteredClients.map(
              ([clientName, clientEvents]) => {
                const sortedClientEvents = [
                  ...clientEvents,
                ].sort((a, b) => {
                  if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                  }

                  return a.time.localeCompare(b.time);
                });

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
                        {clientEvents.length} event
                        {clientEvents.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div
                      className={`client-payment-badge ${
                        clientEvents.every(
                          (event) =>
                            event.paymentStatus === "Fully Paid"
                        )
                          ? "fully-paid"
                          : clientEvents.some(
                              (event) =>
                                event.paymentStatus === "Downpayment Paid" ||
                                event.paymentStatus === "Fully Paid"
                            )
                          ? "downpayment-paid"
                          : "unpaid"
                      }`}
                    >
                      <span className="client-payment-dot"></span>

                      {clientEvents.every(
                        (event) =>
                          event.paymentStatus === "Fully Paid"
                      )
                        ? "Fully Paid"
                        : clientEvents.some(
                            (event) =>
                              event.paymentStatus === "Downpayment Paid" ||
                              event.paymentStatus === "Fully Paid"
                          )
                        ? "Downpayment Paid"
                        : "Unpaid"}
                    </div>
                  </div>

                    <div className="client-events">
                      {sortedClientEvents.map((event) => (
                        <div
                          className="client-event"
                          key={event._id}
                        >
                          <strong>
                            {event.type}
                          </strong>

                          <p>
                            <FaCalendarAlt />

                            {dayjs(event.date).format(
                              "MMMM D, YYYY"
                            )}
                          </p>

                          <p>
                            <FaClock />

                            {event.time}
                          </p>

                          <p>
                            <FaMapMarkerAlt />

                            {event.location}
                          </p>

                          <p>
                            <FaBoxOpen />

                            {event.package}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="client-card-view">
                      Click to view full details
                    </div>
                  </div>
                );
              }
            )}
          </div>
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

                <p>
                  {selectedClient.upcomingEvents.length} upcoming
                  {" "}
                  event
                  {selectedClient.upcomingEvents.length !== 1
                    ? "s"
                    : ""}
                  {" · "}
                  {selectedClient.completedEvents.length} completed
                  {" "}
                  event
                  {selectedClient.completedEvents.length !== 1
                    ? "s"
                    : ""}
                </p>
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
                selectedClient.upcomingEvents.map((event) => (
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
                selectedClient.completedEvents.map((event) => (
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
                  </div>
                ))
              )}
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
        />
      )}

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

export default Clients;
