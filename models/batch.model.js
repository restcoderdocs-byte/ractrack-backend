const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true }, // Batch start date
    day: { type: String, required: true }, // e.g., Monday, Weekend
    time: { type: String, required: true }, // e.g., "6:00 PM - 8:00 PM"
    duration: { type: String, required: true }, // e.g., "3 months"
    mode: { type: String, enum: ["Online", "Offline", "Hybrid"], required: true },
    trainer: { type: String, required: true },
    contact: { type: String, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

batchSchema.index({ date: 1, trainer: 1 }); // optimization for queries

const Batch = mongoose.model("Batch", batchSchema);
module.exports = Batch;
