// src/models/enquiry.model.js
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: [true, 'Student reference is required'] },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: [true, 'Course reference is required'] },
    status: {
      type: String,
      enum: ['pending', 'follow-up', 'converted', 'closed'],
      default: 'pending',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

enquirySchema.index({ student: 1, course: 1, deleted: 1 });

enquirySchema.query.notDeleted = function () {
  return this.where({ deleted: false });
};

module.exports = mongoose.model('Enquiry', enquirySchema);
