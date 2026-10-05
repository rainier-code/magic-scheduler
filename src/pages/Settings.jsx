import { useState } from "react";
import Layout from "../components/layout/Layout";
import PageHeader from "../components/common/PageHeader";
import ConfirmModal from "../components/common/ConfirmModal";

import {
  FaCog,
  FaUser,
  FaMapMarkerAlt,
  FaBell,
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const defaultPerformers = [
  "Jow",
  "Mike",
  "Alex",
  "Chris",
  "Kevin",
];

function Settings() {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(
      "magicSchedulerSettings"
    );

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);

      return {
        name: parsedSettings.name || "Jow",
        defaultLocation:
          parsedSettings.defaultLocation || "",
        notifications:
          parsedSettings.notifications ?? true,
        performers:
          parsedSettings.performers || defaultPerformers,
      };
    }

    return {
      name: "Jow",
      defaultLocation: "",
      notifications: true,
      performers: defaultPerformers,
    };
  });

  const [newPerformer, setNewPerformer] = useState("");

  const [editingPerformer, setEditingPerformer] =
    useState(null);

  const [editPerformerValue, setEditPerformerValue] =
    useState("");

  const [modal, setModal] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddPerformer = () => {
    const performer = newPerformer.trim();

    if (!performer) {
      return;
    }

    if (
      settings.performers.some(
        (item) =>
          item.toLowerCase() ===
          performer.toLowerCase()
      )
    ) {
      setModal({
        type: "error",
        title: "Performer Already Exists",
        message:
          "This performer already exists in your settings.",
      });

      return;
    }

    setSettings({
      ...settings,
      performers: [
        ...settings.performers,
        performer,
      ],
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
        performers: settings.performers.filter(
          (item) => item !== modal.item
        ),
      });
    }

    setModal(null);
  };

  const startEditPerformer = (performer) => {
    setEditingPerformer(performer);
    setEditPerformerValue(performer);
  };

  const saveEditedPerformer = () => {
    const updatedPerformer =
      editPerformerValue.trim();

    if (!updatedPerformer) {
      return;
    }

    if (
      settings.performers.some(
        (item) =>
          item !== editingPerformer &&
          item.toLowerCase() ===
            updatedPerformer.toLowerCase()
      )
    ) {
      setModal({
        type: "error",
        title: "Performer Already Exists",
        message:
          "This performer already exists in your settings.",
      });

      return;
    }

    setSettings({
      ...settings,
      performers: settings.performers.map((item) =>
        item === editingPerformer
          ? updatedPerformer
          : item
      ),
    });

    setEditingPerformer(null);
    setEditPerformerValue("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "magicSchedulerSettings",
      JSON.stringify(settings)
    );

    setModal({
      type: "success",
      title: "Settings Saved",
      message:
        "Your scheduler settings have been saved successfully.",
    });
  };

  const closeModal = () => {
    setModal(null);
  };

  return (
    <Layout>
      <PageHeader
        icon={<FaCog />}
        title="Settings"
        description="Manage your scheduler preferences and event options."
      />

      <section className="settings-section">
        <form
          className="settings-form"
          onSubmit={handleSubmit}
        >
          {/* PROFILE */}
          <div className="settings-card">
            <div className="settings-title">
              <div className="settings-title-icon">
                <FaUser />
              </div>

              <div>
                <h2>Profile</h2>
                <p>
                  Basic information for your scheduler.
                </p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-name">
                Your Name
              </label>

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
                  Used as your starting point when
                  calculating event distance.
                </p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-location">
                Default Location
              </label>

              <input
                id="settings-location"
                type="text"
                name="defaultLocation"
                value={settings.defaultLocation}
                onChange={handleChange}
                placeholder="Enter your usual starting location"
              />
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
                <p>
                  Manage the performers available
                  when creating an event.
                </p>
              </div>
            </div>

            <div className="settings-manager">
              <div className="settings-add-row">
                <input
                  type="text"
                  value={newPerformer}
                  onChange={(e) =>
                    setNewPerformer(e.target.value)
                  }
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
                {settings.performers.map(
                  (performer) => (
                    <div
                      className="settings-option"
                      key={performer}
                    >
                      {editingPerformer ===
                      performer ? (
                        <div className="settings-edit-row">
                          <input
                            type="text"
                            value={
                              editPerformerValue
                            }
                            onChange={(e) =>
                              setEditPerformerValue(
                                e.target.value
                              )
                            }
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEditedPerformer();
                              }

                              if (e.key === "Escape") {
                                setEditingPerformer(
                                  null
                                );
                                setEditPerformerValue(
                                  ""
                                );
                              }
                            }}
                          />

                          <button
                            type="button"
                            className="settings-edit-save"
                            onClick={
                              saveEditedPerformer
                            }
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="settings-edit-cancel"
                            onClick={() => {
                              setEditingPerformer(
                                null
                              );
                              setEditPerformerValue(
                                ""
                              );
                            }}
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
                              onClick={() =>
                                startEditPerformer(
                                  performer
                                )
                              }
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              title="Delete performer"
                              aria-label={`Delete ${performer}`}
                              onClick={() =>
                                handleDeletePerformer(
                                  performer
                                )
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                )}
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
                <p>
                  Notification preferences for future
                  scheduler alerts.
                </p>
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
                  Receive scheduler alerts when this
                  feature becomes available.
                </small>
              </span>
            </label>
          </div>

          {/* SAVE */}
          <div className="settings-save-wrapper">
            <button
              className="settings-save"
              type="submit"
            >
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

      {(modal?.type === "delete-performer") && (
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