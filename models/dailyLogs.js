const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true
    },
    day: {
      type: Number
    },
    title: {
      type: String
    },
    text: {
      type: String,
      required: true
    },
    proof: {
      type: String
    },
    image: {
      type: String
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("dailyLogs", dailyLogSchema);
