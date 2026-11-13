import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Layout from "../components/layout/Layout";
import PageHeader from "../components/common/PageHeader";
import DataLoadError from "../components/common/DataLoadError";

import {
  FaHistory,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTimes,
  FaBoxOpen,
  FaUsers,
  FaUser,
  FaTag,
  FaSearch,
  FaSortAmountDown,
  FaFilter,
  FaCheckCircle,
  FaRoute,
  FaMoneyBillWave,
} from "react-icons/fa";

const HISTORY_PAGE_SIZE = 8;

const getPaymentStatus = (event) => event.paymentStatus || "Unpaid";

const getPaymentClass = (status) =>
  status.toLowerCase().replace(/\s+/g, "-");

const getBalance = (event) =>
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

const getHistoryPages = (totalPages, currentPage) => {
  const visibleCount = Math.min(totalPages, 5);
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - visibleCount + 1)
  );

  return Array.from({ length: visibleCount }, (_, index) => firstPage + index);
};

function History({ events, eventsLoadError, onRetryLoad }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const today = dayjs().format("YYYY-MM-DD");
  const currentYear = dayjs().format("YYYY");

  // All events whose scheduled date has already passed.
  const pastEvents = useMemo(() => {
    return events.filter((event) => event.date < today);
  }, [events, today]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    let results = pastEvents.filter((event) => {
      const matchesSearch =
        !search ||
        event.client?.toLowerCase().includes(search) ||
        event.type?.toLowerCase().includes(search) ||
        event.location?.toLowerCase().includes(search) ||
        event.package?.toLowerCase().includes(search) ||
        event.performers?.some((performer) =>
          performer.toLowerCase().includes(search)
        );

      if (!matchesSearch) {
        return false;
      }

      if (dateFilter === "this-year") {
        if (!event.date.startsWith(currentYear)) return false;
      }

      if (dateFilter === "previous-years") {
        if (event.date.substring(0, 4) >= currentYear) return false;
      }

      if (paymentFilter !== "all" && getPaymentClass(getPaymentStatus(event)) !== paymentFilter) {
        return false;
      }

      return true;
    });

    results.sort((a, b) => {
      if (a.date !== b.date) {
        return sortOrder === "newest"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }

      return sortOrder === "newest"
        ? b.time.localeCompare(a.time)
        : a.time.localeCompare(b.time);
    });

    return results;
  }, [
    pastEvents,
    searchTerm,
    sortOrder,
    dateFilter,
    paymentFilter,
    currentYear,
  ]);

  const pageCount = Math.ceil(filteredEvents.length / HISTORY_PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, Math.max(pageCount, 1));
  const visibleEvents = filteredEvents.slice(
    (safeCurrentPage - 1) * HISTORY_PAGE_SIZE,
    safeCurrentPage * HISTORY_PAGE_SIZE
  );
  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setPaymentFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  return (
    <Layout>
      <PageHeader
        icon={<FaHistory />}
        title="Event History"
        description="View your completed events and past event records."
      />

      <DataLoadError message={eventsLoadError} onRetry={onRetryLoad} />

      <section className="history-section">

        {/* HISTORY SUMMARY */}
        <div className="history-summary">
          <div className="history-summary-content">
            <div className="history-summary-icon">
              <FaCheckCircle />
            </div>

            <div>
              <h2>Completed Events</h2>

              <p>
                {filteredEvents.length} completed event
                {filteredEvents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="history-total">
            <span>Total Records</span>
            <strong>{pastEvents.length}</strong>
          </div>

        </div>

        {/* SEARCH AND FILTERS */}
        <div className="history-toolbar">

          <div className="history-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search client, event, location..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search event history"
            />

            {searchTerm && (
              <button
                type="button"
                className="history-search-clear"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                aria-label="Clear history search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="history-controls">

            <div className="history-filter">
              <FaFilter />

              <label htmlFor="history-date-filter">
                Date
              </label>

              <select
                id="history-date-filter"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  All Dates
                </option>

                <option value="this-year">
                  This Year
                </option>

                <option value="previous-years">
                  Previous Years
                </option>
              </select>
            </div>

            <div className="history-filter">
              <FaMoneyBillWave />

              <label htmlFor="history-payment-filter">Payment</label>

              <select
                id="history-payment-filter"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="fully-paid">Paid in Full</option>
                <option value="downpayment-paid">Downpayment Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="history-filter">
              <FaSortAmountDown />

              <label htmlFor="history-sort">
                Sort
              </label>

              <select
                id="history-sort"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>
              </select>
            </div>

            {(searchTerm ||
              dateFilter !== "all" ||
              paymentFilter !== "all" ||
              sortOrder !== "newest") && (
              <button
                type="button"
                className="history-clear-filters"
                onClick={clearFilters}
              >
                <FaTimes />
                Clear
              </button>
            )}

          </div>
        </div>

        {/* EMPTY STATE - NO EVENTS */}
        {pastEvents.length === 0 ? (
          <div className="empty-history">
            <div className="empty-history-icon">
              <FaHistory />
            </div>

            <h3>No completed events yet</h3>

            <p>
              Events will automatically appear here after
              their scheduled date has passed.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* EMPTY STATE - NO SEARCH RESULTS */
          <div className="empty-history">
            <div className="empty-history-icon">
              <FaSearch />
            </div>

            <h3>No matching events</h3>

            <p>
              No completed event matches your current
              search or filters.
            </p>

            <button
              type="button"
              className="clear-history-search-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* HISTORY CARDS */
          <div className="history-grid">
            {visibleEvents.map((event) => (
              <button
                type="button"
                className="history-card"
                key={event._id}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="history-card-top">

                  <div className="history-client">
                    <div className="history-avatar">
                      {event.client
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="history-client-info">
                      <h3>{event.client}</h3>

                      <span>{event.type}</span>
                    </div>
                  </div>

                  <div className="history-status">
                    <FaCheckCircle />
                    Completed
                  </div>
                </div>

                <div className="history-card-details">

                  <div className="history-detail">
                    <FaCalendarAlt />

                    <div>
                      <small>Date</small>

                      <span>
                        {dayjs(event.date).format(
                          "MMM D, YYYY"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="history-detail">
                    <FaClock />

                    <div>
                      <small>Time</small>

                      <span>{event.time}</span>
                    </div>
                  </div>

                  <div className="history-detail history-detail-location">
                    <FaMapMarkerAlt />

                    <div>
                      <small>Location</small>

                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="history-detail">
                    <FaBoxOpen />

                    <div>
                      <small>Package</small>

                      <span>{event.package}</span>
                    </div>
                  </div>

                </div>

                <div className="history-card-payment">
                  <span className={`history-payment-status ${getPaymentClass(getPaymentStatus(event))}`}>
                    {getPaymentStatus(event)}
                  </span>
                  <span>Balance {formatPeso(getBalance(event))}</span>
                </div>

                <div className="history-card-footer">

                  <span className="history-performers">
                    <FaUsers />

                    {event.performers?.length || 0} performer
                    {event.performers?.length !== 1
                      ? "s"
                      : ""}
                  </span>

                  <span className="history-view-record">
                    View Record
                  </span>

                </div>
              </button>
            ))}
          </div>
        )}

        {filteredEvents.length > 0 && pageCount > 1 && (
          <nav className="history-pagination" aria-label="History record pages">
            <span className="history-pagination-summary">
              Showing {(safeCurrentPage - 1) * HISTORY_PAGE_SIZE + 1}–
              {Math.min(safeCurrentPage * HISTORY_PAGE_SIZE, filteredEvents.length)}
              {" of "}{filteredEvents.length}
            </span>
            <div className="history-pagination-controls">
              <button
                type="button"
                aria-label="Previous page"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(safeCurrentPage - 1)}
              >
                Previous
              </button>
              {getHistoryPages(pageCount, safeCurrentPage).map((page) => (
                <button
                  type="button"
                  className="pagination-page-button"
                  key={page}
                  aria-label={`Page ${page}`}
                  aria-current={page === safeCurrentPage ? "page" : undefined}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={safeCurrentPage === pageCount}
                onClick={() => setCurrentPage(safeCurrentPage + 1)}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>

      {/* HISTORY RECORD MODAL */}
      {selectedEvent && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="history-modal-close"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event record"
            >
              <FaTimes />
            </button>

            {/* MODAL HEADER */}
            <div className="history-modal-header">

              <div className="history-modal-icon">
                <FaHistory />
              </div>

              <div className="history-modal-title">
                <h2>{selectedEvent.client}</h2>

                <p>
                  Completed Event Record
                </p>
              </div>

            </div>

            {/* COMPLETED BANNER */}
            <div className="history-completed-banner">
              <FaCheckCircle />

              <div>
                <strong>Completed Event</strong>

                <span>
                  This event is part of your event history.
                </span>
              </div>
            </div>

            {/* EVENT DETAILS */}
            <div className="history-receipt">

              <div className="receipt-title">
                <span>EVENT DETAILS</span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaUser />
                  <strong>Client</strong>
                </div>

                <span>
                  {selectedEvent.client}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaTag />
                  <strong>Event Type</strong>
                </div>

                <span>
                  {selectedEvent.type}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaBoxOpen />
                  <strong>Package</strong>
                </div>

                <span>
                  {selectedEvent.package}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaCalendarAlt />
                  <strong>Date</strong>
                </div>

                <span>
                  {dayjs(selectedEvent.date).format(
                    "MMMM D, YYYY"
                  )}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaClock />
                  <strong>Time</strong>
                </div>

                <span>
                  {selectedEvent.time}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaMapMarkerAlt />
                  <strong>Location</strong>
                </div>

                <span>
                  {selectedEvent.location}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaRoute />
                  <strong>Distance</strong>
                </div>

                <span>
                  {selectedEvent.distance
                    ? `${selectedEvent.distance} km`
                    : "Not recorded"}
                </span>
              </div>

              <div className="receipt-row">
                <div>
                  <FaUsers />
                  <strong>Performers</strong>
                </div>

                <span>
                  {selectedEvent.performers?.length > 0
                    ? selectedEvent.performers.join(", ")
                    : "None"}
                </span>
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
                      {Number(selectedEvent.totalAmount || 0).toLocaleString(
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
                      {Number(selectedEvent.downpayment || 0).toLocaleString(
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
                      {getBalance(selectedEvent).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong
                      className={`client-payment-status ${
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

            </div>

            {/* READ ONLY MESSAGE */}
            <div className="history-readonly">
              <FaHistory />

              <span>
                This is a read-only historical record.
              </span>
            </div>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              className="history-modal-done"
              onClick={() => setSelectedEvent(null)}
            >
              Close Record
            </button>

          </div>
        </div>
      )}
    </Layout>
  );
}

export default History;
