import { useState } from "react";
import axios from "axios";

import {
  FaEdit,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaRoute,
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

function EditEvent({ event, onClose, onUpdateEvent }) {
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
      console.error("Failed to load performer settings:", error);

      return defaultPerformers;
    }
  });

  const [form, setForm] = useState({
    ...event,
    performers: event.performers || [],

    // Payment information
    totalAmount: event.totalAmount ?? 0,
    downpayment: event.downpayment ?? 0,
    balance: event.balance ?? 0,
    paymentStatus: event.paymentStatus || "Unpaid",
  });

  // Custom event type (used when "Others" is selected)
  const [editOtherType, setEditOtherType] = useState(
    event.type && !standardEventTypes.includes(event.type) ? event.type : ""
  );

  const [editOtherPackage, setEditOtherPackage] = useState(
    event.package && !standardPackages.includes(event.package)
      ? event.package
      : ""
  );

  const existingCustomPerformer = event.performers?.find(
    (performer) => !performerOptions.includes(performer)
  );

  const [editOtherPerformer, setEditOtherPerformer] = useState(
    existingCustomPerformer || ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /*
    "OTHERS" HELPERS
  */

  const isOtherType =
    form.type === "Others" ||
    (form.type && !standardEventTypes.includes(form.type));

  const isOtherPackage =
    form.package === "Others" ||
    (form.package && !standardPackages.includes(form.package));

  /*
    PAYMENT CALCULATION
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
        performers: [...(form.performers || []), name],
      });
    } else {
      setForm({
        ...form,
        performers: (form.performers || []).filter((person) => person !== name),
      });
    }
  };

  const handleUpdate = async () => {
    if (!form.client.trim()) {
      setErrorMessage("Please enter the client's name.");
      return;
    }

    if (isOtherType && !editOtherType.trim()) {
      setErrorMessage("Please enter the event type.");
      return;
    }

    if (!form.location.trim()) {
      setErrorMessage("Please enter the event location.");
      return;
    }

    if (isOtherPackage && !editOtherPackage.trim()) {
      setErrorMessage("Please enter the package name.");
      return;
    }

    if (form.performers?.includes("Others") && !editOtherPerformer.trim()) {
      setErrorMessage("Please enter the performer's name.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (form.date < today) {
      setErrorMessage("Event date cannot be in the past.");
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

    try {
      const eventCoordinates = await getCoordinates(form.location);

      const savedSettings = localStorage.getItem("magicSchedulerSettings");

      let userCoordinates;

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);

        if (settings.defaultLocation?.trim()) {
          try {
            userCoordinates = await getCoordinates(
              settings.defaultLocation
            );
          } catch {
            setErrorMessage(
              "The default location in Settings could not be found. Please update it in Settings or connect to your current location."
            );
            setIsSaving(false);
            return;
          }
        }
      }

      if (!userCoordinates) {
        try {
          userCoordinates = await getCurrentLocation();
        } catch {
          setErrorMessage(
            "Please connect to your location or set a default location in Settings to calculate the distance."
          );
          setIsSaving(false);
          return;
        }
      }

      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        eventCoordinates.latitude,
        eventCoordinates.longitude
      );

      const calculatedDistance = distance.toFixed(1);

      // Use the typed value whenever "Others" / a custom value is active
      const finalType = isOtherType ? editOtherType.trim() : form.type;

      const finalPackage = isOtherPackage
        ? editOtherPackage.trim()
        : form.package;

      const finalPerformers = [
        ...(form.performers || []).filter((person) => person !== "Others"),
        ...(form.performers?.includes("Others") && editOtherPerformer.trim()
          ? [editOtherPerformer.trim()]
          : []),
      ];

      const updatedEventData = {
        client: form.client,
        type: finalType,
        package: finalPackage,
        location: form.location,
        distance: calculatedDistance,
        date: form.date,
        time: form.time,
        performers: finalPerformers,

        // Payment information
        totalAmount: totalAmount,
        downpayment: downpayment,
        balance: balance,
        paymentStatus: paymentStatus,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/events/${event._id}`,
        updatedEventData
      );

      if (onUpdateEvent) {
        onUpdateEvent(response.data);
      }

      setSuccessMessage("The event has been updated successfully.");
    } catch (error) {
      console.error("Failed to update event:", error);

      setErrorMessage(error.message || "Failed to update event.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="edit-event-overlay" onClick={onClose}>
        <div className="edit-event-modal" onClick={(e) => e.stopPropagation()}>
          {/* HEADER */}
          <div className="edit-event-header">
            <div className="edit-event-header-left">
              <div className="edit-event-header-icon">
                <FaEdit />
              </div>

              <div>
                <h2>Edit Event</h2>

                <p>Update the details of this event.</p>
              </div>
            </div>

            <button
              type="button"
              className="edit-event-close"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close edit event"
            >
              <FaTimes />
            </button>
          </div>

          {/* EVENT DETAILS */}
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaCalendarAlt />

              <div>
                <h3>Event Details</h3>

                <p>Basic information about the event</p>
              </div>
            </div>

            <div className="edit-form-grid">
              <div className="edit-field full">
                <label>Client Name</label>

                <div className="edit-input-wrapper">
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

              <div className="edit-field full">
                <label>Event Type</label>

                <div className="edit-input-wrapper">
                  <FaTag />

                  <select
                    name="type"
                    value={
                      standardEventTypes.includes(form.type)
                        ? form.type
                        : form.type
                        ? "Others"
                        : ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
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

                {isOtherType && (
                  <input
                    className="edit-extra-input"
                    type="text"
                    placeholder="Enter event type"
                    value={editOtherType}
                    onChange={(e) => setEditOtherType(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* PACKAGE */}
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaBullhorn />

              <div>
                <h3>Package</h3>

                <p>Track how the event was booked</p>
              </div>
            </div>

            <div className="edit-field">
              <label>Package</label>

              <div className="edit-input-wrapper">
                <FaBoxOpen />

                <select
                  name="package"
                  value={
                    standardPackages.includes(form.package)
                      ? form.package
                      : form.package
                      ? "Others"
                      : ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      package: e.target.value,
                    })
                  }
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

              {isOtherPackage && (
                <input
                  className="edit-extra-input"
                  type="text"
                  placeholder="Enter package name"
                  value={editOtherPackage}
                  onChange={(e) => setEditOtherPackage(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* PERFORMERS */}
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaUsers />

              <div>
                <h3>Performers</h3>

                <p>Select everyone performing at the event</p>
              </div>
            </div>

            <div className="edit-options performer-options">
              {performerOptions.map((name) => (
                <label
                  key={name}
                  className={`edit-option checkbox ${
                    form.performers?.includes(name) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.performers?.includes(name)}
                    onChange={(e) =>
                      handlePerformerChange(name, e.target.checked)
                    }
                  />

                  <span>{name}</span>
                </label>
              ))}

              <label
                className={`edit-option checkbox ${
                  form.performers?.includes("Others") ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.performers?.includes("Others")}
                  onChange={(e) =>
                    handlePerformerChange("Others", e.target.checked)
                  }
                />

                <span>Others</span>
              </label>
            </div>

            {form.performers?.includes("Others") && (
              <input
                className="edit-extra-input"
                type="text"
                placeholder="Enter performer's name"
                value={editOtherPerformer}
                onChange={(e) => setEditOtherPerformer(e.target.value)}
              />
            )}
          </div>

          {/* LOCATION */}
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaMapMarkerAlt />

              <div>
                <h3>Location</h3>

                <p>Where will the event take place?</p>
              </div>
            </div>

            <div className="edit-field">
              <label>Event Location</label>

              <div className="edit-input-wrapper">
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

            <div className="edit-distance-box">
              <div className="edit-distance-icon">
                <FaRoute />
              </div>

              <div>
                <span>Current Distance</span>

                <strong>
                  {form.distance ? `${form.distance} km` : "Not calculated"}
                </strong>
              </div>
            </div>
          </div>

          {/* SCHEDULE */}
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaClock />

              <div>
                <h3>Schedule</h3>

                <p>Set the date and time of the event</p>
              </div>
            </div>

            <div className="edit-schedule-grid">
              <div className="edit-field">
                <label>Date</label>

                <div className="edit-input-wrapper">
                  <FaCalendarAlt />

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="edit-field">
                <label>Time</label>

                <div className="edit-input-wrapper">
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
          <div className="edit-event-section">
            <div className="edit-event-section-title">
              <FaMoneyBillWave />

              <div>
                <h3>Payment Information</h3>

                <p>Manage the event payment</p>
              </div>
            </div>

            <div className="edit-form-grid payment-form-grid">
              {/* TOTAL AMOUNT */}
              <div className="edit-field">
                <label>Total Amount</label>

                <div className="edit-input-wrapper">
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
              <div className="edit-field">
                <label>Downpayment</label>

                <div className="edit-input-wrapper">
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
              <div className="edit-field">
                <label>Balance</label>

                <div className="edit-input-wrapper">
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
              <div className="edit-field">
                <label>Status</label>

                <div className="edit-input-wrapper">
                  <FaMoneyBillWave />

                  <input type="text" value={paymentStatus} readOnly />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="edit-event-footer">
            <button
              type="button"
              className="edit-cancel-button"
              onClick={onClose}
              disabled={isSaving}
            >
              <FaTimes />
              Cancel
            </button>

            <button
              type="button"
              className="edit-save-button"
              onClick={handleUpdate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FaSpinner className="edit-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <ConfirmModal
          title="Event Updated Successfully"
          message={successMessage}
          type="success"
          confirmText="OK"
          cancelText=""
          onConfirm={() => {
            setSuccessMessage("");
            onClose();
          }}
          onCancel={() => {
            setSuccessMessage("");
            onClose();
          }}
        />
      )}

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

export default EditEvent;