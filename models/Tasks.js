const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  task: {
    type: String
  },
  days: {
    type: Array
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("task", taskSchema);