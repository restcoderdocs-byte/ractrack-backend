const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], required: true },
    announcedDate: { type: Date, required: true },
    scheduledDate: { type: Date, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for optimized lookups
interviewSchema.index({ companyName: 1, status: 1 });

const Interview = mongoose.model("Interview", interviewSchema);
module.exports = Interview;
