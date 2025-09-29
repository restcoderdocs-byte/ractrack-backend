const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    photo: { type: String, required: true },
    designation: { type: String, required: true },
    description: { type: String, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for optimized lookups
trainerSchema.index({ name: 1, designation: 1 });

const Trainer = mongoose.model("Trainer", trainerSchema);
module.exports = Trainer;
