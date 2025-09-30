// src/models/interview.model.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: [true, 'Student reference is required'] },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: [true, 'Client reference is required'] },
    date: { type: Date, required: [true, 'Interview date is required'] },
    status: {
      type: String,
      enum: ['scheduled', 'attended', 'missed', 'selected', 'rejected'],
      default: 'scheduled',
    },
    notes: { type: String, maxlength: [500, 'Notes cannot exceed 500 characters'] },

    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

interviewSchema.index({ student: 1, client: 1, deleted: 1 });

interviewSchema.query.notDeleted = function () {
  return this.where({ deleted: false });
};

module.exports = mongoose.model('Interview', interviewSchema);
