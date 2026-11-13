const mongoose = require("mongoose");
const Event = require("../models/Event");
const validateEventPayload = require("../utils/validateEventPayload");

const reportDatabaseFailure = (res, message, error) => {
  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: "Please check the event details." });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: "This event record already exists." });
  }
  // Keep database details in server logs only; never send them to the browser.
  console.error(message, error?.name || "UnknownError");
  return res.status(500).json({ message });
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, time: 1 }).lean();
    return res.json(events);
  } catch (error) {
    return reportDatabaseFailure(res, "Unable to load events. Please try again.", error);
  }
};

const createEvent = async (req, res) => {
  const { errors, data } = validateEventPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ message: "Please check the event details.", errors });
  }

  try {
    const newEvent = await Event.create(data);
    return res.status(201).json(newEvent);
  } catch (error) {
    return reportDatabaseFailure(res, "Unable to save this event. Please try again.", error);
  }
};

const updateEvent = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });

    const { errors, data } = validateEventPayload(req.body, event.toObject());
    if (errors.length) {
      return res.status(400).json({ message: "Please check the event details.", errors });
    }

    const dateChanged = data.date !== event.date;
    Object.assign(event, data);
    if (dateChanged) event.reminderSent = false;

    return res.json(await event.save());
  } catch (error) {
    return reportDatabaseFailure(res, "Unable to update this event. Please try again.", error);
  }
};

const deleteEvent = async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found." });
    return res.json({ message: "Event deleted successfully." });
  } catch (error) {
    return reportDatabaseFailure(res, "Unable to delete this event. Please try again.", error);
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
