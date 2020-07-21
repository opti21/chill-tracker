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
  image: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("dailyLogs", dailyLogSchema);
