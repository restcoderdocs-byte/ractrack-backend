const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    targetAudience: { type: String, required: true },
    frontend: { type: String, enum: ["React", "Vue", "Angular", "None"], required: true },
    backend: { type: String, enum: ["Node", "Django", "Laravel", "None"], required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for optimized queries
courseSchema.index({ name: 1, targetAudience: 1 });

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
