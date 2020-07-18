const mongoose = require("mongoose");

const dailyLogSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  proof: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date(),
  },
});

module.exports = mongoose.model("dailyLogs", dailyLogSchema);
