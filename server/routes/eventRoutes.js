const express = require("express");

const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

// Get all events
router.get("/", getEvents);

// Create a new event
router.post("/", createEvent);

// Update an event
router.put("/:id", updateEvent);

// Delete an event
router.delete("/:id", deleteEvent);

module.exports = router;