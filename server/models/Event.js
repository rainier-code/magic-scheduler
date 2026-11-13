const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    client: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    package: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    distance: {
      type: String,
      default: "",
      maxlength: 20,
    },

    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    performers: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
      validate: {
        validator: (performers) => performers.length <= 40,
        message: "A booking can have at most 40 performers.",
      },
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    downpayment: {
      type: Number,
      default: 0,
      min: 0,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Downpayment Paid", "Fully Paid"],
      default: "Unpaid",
    },
    
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
