const mongoose = require("mongoose");

const newDailyLogSchema = new mongoose.Schema(
  {
    taskID: {
      type: String,
      required: true
    },
    user: {
      type: Number,
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

module.exports = mongoose.model("newDailyLog", newDailyLogSchema);
