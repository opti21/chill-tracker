const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: String,
    },
    task: {
      type: String,
      required: true,
    },
    days: {
      type: Array,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("task", taskSchema);
