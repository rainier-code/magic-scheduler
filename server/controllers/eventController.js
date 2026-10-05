const Event = require("../models/Event");

// Get all events
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, time: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get events",
      error: error.message,
    });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  try {
    const newEvent = await Event.create(req.body);

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create event",
      error: error.message,
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update event",
      error: error.message,
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(
      req.params.id
    );

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};