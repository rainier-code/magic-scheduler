import { useState } from "react";
import Layout from "../components/layout/Layout";
import PageHeader from "../components/common/PageHeader";
import ConfirmModal from "../components/common/ConfirmModal";
import {
  getCoordinates,
  getCurrentLocation,
  reverseGeocode,
} from "../utils/geocoding"; // adjust to wherever your location helpers live

import {
  FaCog,
  FaUser,
  FaMapMarkerAlt,
  FaBell,
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCrosshairs,
  FaSearchLocation,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
} from "react-icons/fa";

const defaultPerformers = ["Mark"];

function Settings() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("magicSchedulerSettings");

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);

      return {
        name: parsedSettings.name || "Mark",
        defaultLocation: parsedSettings.defaultLocation || "",
        defaultCoordinates: parsedSettings.defaultCoordinates || null,
        notifications: parsedSettings.notifications ?? true,
        performers: parsedSettings.performers || defaultPerformers,
      };
    }

    return {
      name: "Mark",
      defaultLocation: "",
      defaultCoordinates: null,
      notifications: true,
      performers: defaultPerformers,
    };
  });

  // Location verification state: idle | loading | verified | error
  const [locationStatus, setLocationStatus] = useState(() =>
    settings.defaultCoordinates ? "verified" : "idle"
  );
  const [locationMessage, setLocationMessage] = useState("");

  const [newPerformer, setNewPerformer] = useState("");
  const [editingPerformer, setEditingPerformer] = useState(null);
  const [editPerformerValue, setEditPerformerValue] = useState("");
  const [modal, setModal] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /* ---------------- LOCATION ---------------- */

  const handleLocationChange = (e) => {
    // Typing invalidates any previously verified coordinates
    setSettings({
      ...settings,
      defaultLocation: e.target.value,
      defaultCoordinates: null,
    });
    setLocationStatus("idle");
    setLocationMessage("");
  };

  const handleVerifyLocation = async () => {
    if (!settings.defaultLocation.trim()) {
      setLocationStatus("error");
      setLocationMessage("Enter a location to verify.");
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("Checking location...");

    try {
      const { latitude, longitude, displayName } = await getCoordinates(
        settings.defaultLocation
      );

      setSettings((current) => ({
        ...current,
        defaultCoordinates: { latitude, longitude },
      }));
      setLocationStatus("verified");
      setLocationMessage(displayName);
    } catch (error) {
      setLocationStatus("error");
      setLocationMessage(error.message);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocationStatus("loading");
    setLocationMessage("Getting your current location...");

    try {
      const { latitude, longitude } = await getCurrentLocation();
      const label = await reverseGeocode(latitude, longitude);

      setSettings((current) => ({
        ...current,
        defaultLocation: label,
        defaultCoordinates: { latitude, longitude },
      }));
      setLocationStatus("verified");
      setLocationMessage("Using your current location.");
    } catch (error) {
      setLocationStatus("error");
      setLocationMessage(error.message);
    }
  };

  const handleClearLocation = () => {
    setSettings({
      ...settings,
      defaultLocation: "",
      defaultCoordinates: null,
    });
    setLocationStatus("idle");
    setLocationMessage("");
  };

  /* ---------------- PERFORMERS ---------------- */

  const handleAddPerformer = () => {
    const performer = newPerformer.trim();

    if (!performer) {
      return;
    }

    if (
      settings.performers.some(
        (item) => item.toLowerCase() === performer.toLowerCase()
      )
    ) {
      setModal({
        type: "error",
        title: "Performer Already Exists",
        message: "This performer already exists in your settings.",
      });

      return;
    }

    setSettings({
      ...settings,
      performers: [...settings.performers, performer],
    });

    setNewPerformer("");
  };

  const handleDeletePerformer = (performer) => {
    setModal({
      type: "delete-performer",
      item: performer,
      title: "Delete Performer",
      message: `Are you sure you want to delete "${performer}" from your performers?`,
    });
  };

  const confirmDelete = () => {
    if (modal?.type === "delete-performer") {
      setSettings({
        ...settings,
        performers: settings.performers.filter((item) => item !== modal.item),
      });
    }

    setModal(null);
  };

  const startEditPerformer = (performer) => {
    setEditingPerformer(performer);
    setEditPerformerValue(performer);
  };

  const cancelEditPerformer = () => {
    setEditingPerformer(null);
    setEditPerformerValue("");
  };

  const saveEditedPerformer = () => {
    const updatedPerformer = editPerformerValue.trim();

    if (!updatedPerformer) {
      return;
    }

    if (
      settings.performers.some(
        (item) =>
          item !== editingPerformer &&
          item.toLowerCase() === updatedPerformer.toLowerCase()
      )
    ) {
      setModal({
        type: "error",
        title: "Performer Already Exists",
        message: "This performer already exists in your settings.",
      });

      return;
    }

    setSettings({
      ...settings,
      performers: settings.performers.map((item) =>
        item === editingPerformer ? updatedPerformer : item
      ),
    });

    cancelEditPerformer();
  };

  /* ---------------- SAVE ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    let settingsToSave = settings;

    // If a location was typed but never verified, verify it now
    // so distance calculations never have to guess later.
    if (settings.defaultLocation.trim() && !settings.defaultCoordinates) {
      setLocationStatus("loading");
      setLocationMessage("Checking location...");

      try {
        const { latitude, longitude, displayName } = await getCoordinates(
          settings.defaultLocation
        );

        settingsToSave = {
          ...settings,
          defaultCoordinates: { latitude, longitude },
        };

        setSettings(settingsToSave);
        setLocationStatus("verified");
        setLocationMessage(displayName);
      } catch (error) {
        setLocationStatus("error");
        setLocationMessage(error.message);

        setModal({
          type: "error",
          title: "Location Not Found",
          message:
            "We couldn't find your default location, so settings weren't saved. Try a more specific address or use your current location.",
        });

        return;
      }
    }

    localStorage.setItem(
      "magicSchedulerSettings",
      JSON.stringify(settingsToSave)
    );

    setModal({
      type: "success",
      title: "Settings Saved",
      message: "Your scheduler settings have been saved successfully.",
    });
  };

  const closeModal = () => {
    setModal(null);
  };

  const isLocating = locationStatus === "loading";

  return (
    <Layout>
      <PageHeader
        icon={<FaCog />}
        title="Settings"
        description="Manage your scheduler preferences and event options."
      />

      <section className="settings-section">
        <form className="settings-form" onSubmit={handleSubmit}>
          {/* PROFILE */}
          <div className="settings-card">
            <div className="settings-title">
              <div className="settings-title-icon">
                <FaUser />
              </div>

              <div>
                <h2>Profile</h2>
                <p>Basic information for your scheduler.</p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-name">Your Name</label>

              <input
                id="settings-name"
                type="text"
                name="name"
                value={settings.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div className="settings-card">
            <div className="settings-title">
              <div className="settings-title-icon">
                <FaMapMarkerAlt />
              </div>

              <div>
                <h2>Location</h2>
                <p>
                  Used as your starting point when calculating event distance.
                </p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-location">Default Location</label>

              <div className="settings-location-row">
                <div className="settings-location-input">
                  <input
                    id="settings-location"
                    type="text"
                    name="defaultLocation"
                    value={settings.defaultLocation}
                    onChange={handleLocationChange}
                    placeholder="e.g. Porac, Pampanga"
                    autoComplete="street-address"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVerifyLocation();
                      }
                    }}
                  />

                  {settings.defaultLocation && (
                    <button
                      type="button"
                      className="settings-location-clear"
                      title="Clear location"
                      aria-label="Clear location"
                      onClick={handleClearLocation}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="settings-add-button"
                  onClick={handleVerifyLocation}
                  disabled={isLocating || !settings.defaultLocation.trim()}
                >
                  <FaSearchLocation />
                  Verify
                </button>
              </div>

              <div className="settings-location-actions">
                <button
                  type="button"
                  className="settings-location-current"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                >
                  <FaCrosshairs />
                  Use my current location
                </button>
              </div>

              {locationStatus !== "idle" && (
                <div
                  className={`settings-location-status ${locationStatus}`}
                  role="status"
                  aria-live="polite"
                >
                  {locationStatus === "loading" && (
                    <FaSpinner className="settings-spin" />
                  )}
                  {locationStatus === "verified" && <FaCheckCircle />}
                  {locationStatus === "error" && <FaExclamationCircle />}

                  <span>
                    {locationStatus === "verified" && (
                      <strong>Location verified. </strong>
                    )}
                    {locationMessage}
                  </span>
                </div>
              )}

              {locationStatus === "idle" &&
                settings.defaultLocation.trim() && (
                  <p className="settings-location-hint">
                    Not verified yet. It will be checked automatically when you
                    save.
                  </p>
                )}
            </div>
          </div>

          {/* PERFORMERS */}
          <div className="settings-card">
            <div className="settings-title">
              <div className="settings-title-icon">
                <FaUser />
              </div>

              <div>
                <h2>Performers</h2>
                <p>Manage the performers available when creating an event.</p>
              </div>
            </div>

            <div className="settings-manager">
              <div className="settings-add-row">
                <input
                  type="text"
                  value={newPerformer}
                  onChange={(e) => setNewPerformer(e.target.value)}
                  placeholder="Enter new performer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPerformer();
                    }
                  }}
                />

                <button
                  type="button"
                  className="settings-add-button"
                  onClick={handleAddPerformer}
                >
                  <FaPlus />
                  Add Performer
                </button>
              </div>

              <div className="settings-option-list">
                {settings.performers.map((performer) => (
                  <div className="settings-option" key={performer}>
                    {editingPerformer === performer ? (
                      <div className="settings-edit-row">
                        <input
                          type="text"
                          value={editPerformerValue}
                          onChange={(e) =>
                            setEditPerformerValue(e.target.value)
                          }
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEditedPerformer();
                            }

                            if (e.key === "Escape") {
                              cancelEditPerformer();
                            }
                          }}
                        />

                        <button
                          type="button"
                          className="settings-edit-save"
                          onClick={saveEditedPerformer}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          className="settings-edit-cancel"
                          onClick={cancelEditPerformer}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{performer}</span>

                        <div className="settings-option-actions">
                          <button
                            type="button"
                            title="Edit performer"
                            aria-label={`Edit ${performer}`}
                            onClick={() => startEditPerformer(performer)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            title="Delete performer"
                            aria-label={`Delete ${performer}`}
                            onClick={() => handleDeletePerformer(performer)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="settings-card">
            <div className="settings-title">
              <div className="settings-title-icon">
                <FaBell />
              </div>

              <div>
                <h2>Notifications</h2>
                <p>Notification preferences for future scheduler alerts.</p>
              </div>
            </div>

            <label className="settings-toggle">
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
              />

              <span className="toggle-slider"></span>

              <span>
                <strong>Enable notifications</strong>
                <small>
                  Receive scheduler alerts when this feature becomes available.
                </small>
              </span>
            </label>
          </div>

          {/* SAVE */}
          <div className="settings-save-wrapper">
            <button className="settings-save" type="submit" disabled={isLocating}>
              <FaSave />
              Save Settings
            </button>
          </div>
        </form>
      </section>

      {/* MODALS */}
      {modal?.type === "success" && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          type="success"
          confirmText="OK"
          cancelText=""
          onConfirm={closeModal}
          onCancel={closeModal}
        />
      )}

      {modal?.type === "error" && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          type="error"
          confirmText="OK"
          cancelText=""
          onConfirm={closeModal}
          onCancel={closeModal}
        />
      )}

      {modal?.type === "delete-performer" && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
      )}
    </Layout>
  );
}

export default Settings;