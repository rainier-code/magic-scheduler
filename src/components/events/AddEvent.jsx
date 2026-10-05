import { useState, useEffect } from "react";
import axios from "axios";

import {
  FaPlus,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaUsers,
  FaBullhorn,
  FaBoxOpen,
  FaSave,
  FaSpinner,
  FaMoneyBillWave,
} from "react-icons/fa";

import { getCoordinates } from "../../utils/geocoding";
import { getCurrentLocation } from "../../utils/location";
import { calculateDistance } from "../../utils/distance";
import ConfirmModal from "../common/ConfirmModal";

const defaultPerformers = ["Mark"];

const standardEventTypes = [
  "Birthday",
  "Wedding",
  "Corporate",
  "Debut",
  "Christmas Party",
];

const standardPackages = ["Package A", "Package B", "Package C"];

const emptyForm = {
  client: "",
  type: "",
  package: "",
  location: "",
  distance: "",
  date: "",
  time: "",
  performers: [],

  // Payment information
  totalAmount: "",
  downpayment: "",
};

function AddEvent({ onAddEvent, onClose }) {
  const [performerOptions] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("magicSchedulerSettings");

      if (!savedSettings) {
        return defaultPerformers;
      }

      const settings = JSON.parse(savedSettings);

      return Array.isArray(settings.performers)
        ? settings.performers
        : defaultPerformers;
    } catch (error) {
      console.error("Failed to load scheduler settings:", error);

      return defaultPerformers;
    }
  });

  const [form, setForm] = useState(emptyForm);

  const [otherType, setOtherType] = useState("");
  const [otherPackage, setOtherPackage] = useState("");
  const [otherPerformer, setOtherPerformer] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // The modal can close itself, so it works even if the parent
  // does not control it with an onClose handler.
  const [isOpen, setIsOpen] = useState(true);

  const todayString = new Date().toISOString().split("T")[0];

  /*
    PAYMENT CALCULATION
    Balance = Total Amount - Downpayment
  */

  const totalAmount = Number(form.totalAmount) || 0;
  const downpayment = Number(form.downpayment) || 0;
  const balance = Math.max(totalAmount - downpayment, 0);

  let paymentStatus = "Unpaid";

  if (totalAmount > 0 && balance === 0) {
    paymentStatus = "Fully Paid";
  } else if (downpayment > 0) {
    paymentStatus = "Downpayment Paid";
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePerformerChange = (name, checked) => {
    if (checked) {
      setForm({
        ...form,
        performers: [...form.performers, name],
      });
    } else {
      setForm({
        ...form,
        performers: form.performers.filter((person) => person !== name),
      });

      if (name === "Others") {
        setOtherPerformer("");
      }
    }
  };

  const handleClose = () => {
    if (isSaving) return;

    setIsOpen(false);

    if (onClose) {
      onClose();
    }
  };

  // Close with the Escape key (ignored while an error message is showing)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isSaving && !errorMessage) {
        setIsOpen(false);

        if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, errorMessage, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.client.trim()) {
      setErrorMessage("Please enter the client's name.");
      return;
    }

    if (!form.type) {
      setErrorMessage("Please select the event type.");
      return;
    }

    if (form.type === "Others" && !otherType.trim()) {
      setErrorMessage("Please enter the event type.");
      return;
    }

    if (!form.package) {
      setErrorMessage("Please select a package.");
      return;
    }

    if (form.package === "Others" && !otherPackage.trim()) {
      setErrorMessage("Please enter the package name.");
      return;
    }

    if (form.performers.includes("Others") && !otherPerformer.trim()) {
      setErrorMessage("Please enter the performer's name.");
      return;
    }

    if (!form.location.trim()) {
      setErrorMessage("Please enter the event location.");
      return;
    }

    if (!form.date) {
      setErrorMessage("Please select the event date.");
      return;
    }

    if (form.date < todayString) {
      setErrorMessage("Event date cannot be in the past.");
      return;
    }

    if (!form.time) {
      setErrorMessage("Please select the event time.");
      return;
    }

    /*
      PAYMENT VALIDATION
    */

    if (totalAmount < 0) {
      setErrorMessage("Total amount cannot be negative.");
      return;
    }

    if (downpayment < 0) {
      setErrorMessage("Downpayment cannot be negative.");
      return;
    }

    if (downpayment > totalAmount) {
      setErrorMessage("Downpayment cannot be greater than the total amount.");
      return;
    }

    setIsSaving(true);

    let calculatedDistance;

    try {
      const eventCoordinates = await getCoordinates(form.location);

      const savedSettings = localStorage.getItem("magicSchedulerSettings");

      let userCoordinates;

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        if (settings.defaultLocation) {
          userCoordinates = await getCoordinates(settings.defaultLocation);
        }
      }

      if (!userCoordinates) {
        userCoordinates = await getCurrentLocation();
      }

      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        eventCoordinates.latitude,
        eventCoordinates.longitude
      );

      calculatedDistance = distance.toFixed(1);
    } catch (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    const finalType = form.type === "Others" ? otherType.trim() : form.type;

    const finalPackage =
      form.package === "Others" ? otherPackage.trim() : form.package;

    const finalPerformers = [
      ...form.performers.filter((person) => person !== "Others"),
      ...(form.performers.includes("Others") && otherPerformer.trim()
        ? [otherPerformer.trim()]
        : []),
    ];

    const eventData = {
      ...form,

      type: finalType,
      package: finalPackage,
      performers: finalPerformers,
      distance: calculatedDistance,

      // Payment values are saved as numbers
      totalAmount: totalAmount,
      downpayment: downpayment,
      balance: balance,
      paymentStatus: paymentStatus,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/events`,
        eventData
      );

      if (onAddEvent) {
        onAddEvent(response.data);
      }
    } catch (error) {
      console.error("Failed to save event:", error);

      setErrorMessage("Failed to save event to the database.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);

    setForm(emptyForm);
    setOtherType("");
    setOtherPackage("");
    setOtherPerformer("");

    setIsOpen(false);

    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="add-event-modal-overlay" onClick={handleClose}>
        <div className="add-event-modal" onClick={(e) => e.stopPropagation()}>
          <form className="add-form" onSubmit={handleSubmit} noValidate>
            {/* HEADER */}
            <div className="add-event-header">
              <div className="add-event-header-left">
                <div className="add-event-header-icon">
                  <FaPlus />
                </div>

                <div>
                  <h2>Add New Event</h2>

                  <p>Fill in the details to schedule a new event.</p>
                </div>
              </div>

              <button
                type="button"
                className="add-event-close"
                onClick={handleClose}
                disabled={isSaving}
                aria-label="Close add event"
              >
                <FaTimes />
              </button>
            </div>

            {/* EVENT DETAILS */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaCalendarAlt />

                <div>
                  <h3>Event Details</h3>

                  <p>Basic information about the event</p>
                </div>
              </div>

              <div className="add-form-grid">
                <div className="add-field full">
                  <label>Client Name</label>

                  <div className="add-input-wrapper">
                    <FaUser />

                    <input
                      type="text"
                      name="client"
                      value={form.client}
                      onChange={handleChange}
                      placeholder="Enter client name"
                      required
                    />
                  </div>
                </div>

                <div className="add-field full">
                  <label>Event Type</label>

                  <div className="add-input-wrapper">
                    <FaTag />

                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Event Type</option>

                      {standardEventTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}

                      <option value="Others">Others</option>
                    </select>
                  </div>

                  {form.type === "Others" && (
                    <input
                      className="add-extra-input"
                      type="text"
                      placeholder="Enter event type"
                      value={otherType}
                      onChange={(e) => setOtherType(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* PACKAGE */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaBullhorn />

                <div>
                  <h3>Package</h3>

                  <p>Choose the package booked for this event</p>
                </div>
              </div>

              <div className="add-field">
                <label>Package</label>

                <div className="add-input-wrapper">
                  <FaBoxOpen />

                  <select
                    name="package"
                    value={form.package}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Package</option>

                    {standardPackages.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}

                    <option value="Others">Others</option>
                  </select>
                </div>

                {form.package === "Others" && (
                  <input
                    className="add-extra-input"
                    type="text"
                    placeholder="Enter package name"
                    value={otherPackage}
                    onChange={(e) => setOtherPackage(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* PERFORMERS */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaUsers />

                <div>
                  <h3>Performers</h3>

                  <p>Select everyone performing at the event</p>
                </div>
              </div>

              <div className="add-options">
                {performerOptions.map((name) => (
                  <label
                    key={name}
                    className={`add-option ${
                      form.performers.includes(name) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.performers.includes(name)}
                      onChange={(e) =>
                        handlePerformerChange(name, e.target.checked)
                      }
                    />

                    <span>{name}</span>
                  </label>
                ))}

                <label
                  className={`add-option ${
                    form.performers.includes("Others") ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.performers.includes("Others")}
                    onChange={(e) =>
                      handlePerformerChange("Others", e.target.checked)
                    }
                  />

                  <span>Others</span>
                </label>
              </div>

              {form.performers.includes("Others") && (
                <input
                  className="add-extra-input"
                  type="text"
                  placeholder="Enter performer's name"
                  value={otherPerformer}
                  onChange={(e) => setOtherPerformer(e.target.value)}
                />
              )}
            </div>

            {/* LOCATION */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaMapMarkerAlt />

                <div>
                  <h3>Location</h3>

                  <p>Where will the event take place?</p>
                </div>
              </div>

              <div className="add-field">
                <label>Event Location</label>

                <div className="add-input-wrapper">
                  <FaMapMarkerAlt />

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Enter event location"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaClock />

                <div>
                  <h3>Schedule</h3>

                  <p>Set the date and time of the event</p>
                </div>
              </div>

              <div className="add-schedule-grid">
                <div className="add-field">
                  <label>Date</label>

                  <div className="add-input-wrapper">
                    <FaCalendarAlt />

                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      min={todayString}
                      required
                    />
                  </div>
                </div>

                <div className="add-field">
                  <label>Time</label>

                  <div className="add-input-wrapper">
                    <FaClock />

                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT INFORMATION */}
            <div className="add-event-section">
              <div className="add-event-section-title">
                <FaMoneyBillWave />

                <div>
                  <h3>Payment Information</h3>

                  <p>Manage the event payment</p>
                </div>
              </div>

              <div className="add-form-grid">
                {/* TOTAL AMOUNT */}
                <div className="add-field">
                  <label>Total Amount</label>

                  <div className="add-input-wrapper">
                    <FaMoneyBillWave />

                    <input
                      type="number"
                      name="totalAmount"
                      value={form.totalAmount}
                      onChange={handleChange}
                      placeholder="₱0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* DOWNPAYMENT */}
                <div className="add-field">
                  <label>Downpayment</label>

                  <div className="add-input-wrapper">
                    <FaMoneyBillWave />

                    <input
                      type="number"
                      name="downpayment"
                      value={form.downpayment}
                      onChange={handleChange}
                      placeholder="₱0.00"
                      min="0"
                      max={totalAmount}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* BALANCE */}
                <div className="add-field">
                  <label>Balance</label>

                  <div className="add-input-wrapper">
                    <FaMoneyBillWave />

                    <input
                      type="text"
                      value={`₱${balance.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                      readOnly
                    />
                  </div>
                </div>

                {/* STATUS */}
                <div className="add-field">
                  <label>Status</label>

                  <div className="add-input-wrapper">
                    <FaMoneyBillWave />

                    <input type="text" value={paymentStatus} readOnly />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="add-event-footer">
              <button
                type="button"
                className="add-cancel-button"
                onClick={handleClose}
                disabled={isSaving}
              >
                <FaTimes />
                Cancel
              </button>

              <button
                type="submit"
                className="add-save-button"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="add-spinner" />
                    Calculating distance...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <ConfirmModal
          title="Please Check Your Information"
          message={errorMessage}
          type="error"
          confirmText="OK"
          cancelText=""
          onConfirm={() => setErrorMessage("")}
          onCancel={() => setErrorMessage("")}
        />
      )}
    </>
  );
}

export default AddEvent;
