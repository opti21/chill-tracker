const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    user: {
      type: Number,
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

module.exports = mongoose.model("newtask", taskSchema);
