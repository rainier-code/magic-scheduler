const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      maxlength: 2048,
    },

    keys: {
      p256dh: {
        type: String,
        required: true,
        maxlength: 200,
      },

      auth: {
        type: String,
        required: true,
        maxlength: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PushSubscription",
  pushSubscriptionSchema
);
