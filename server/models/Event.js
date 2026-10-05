const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    client: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    package: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    distance: {
      type: String,
      default: "",
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    performers: {
      type: [String],
      default: [],
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    downpayment: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Downpayment Paid", "Fully Paid"],
      default: "Unpaid",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);