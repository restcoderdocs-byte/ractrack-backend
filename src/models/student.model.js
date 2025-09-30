// src/models/student.model.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },

    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    enquiries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' }],
    interviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Interview' }],

    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Indexes
studentSchema.index({ name: 'text', email: 'text', phone: 'text' });
studentSchema.index({ deleted: 1 });

// Query helper
studentSchema.query.notDeleted = function () {
  return this.where({ deleted: false });
};

module.exports = mongoose.model('Student', studentSchema);
