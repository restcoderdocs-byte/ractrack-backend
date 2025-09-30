// src/controllers/interview.controller.js
const Interview = require('../models/interview.model');
const Student = require('../models/student.model');
const Audit = require('../models/audit.model');
const { sendResponse } = require('../utils/sendResponse');
const tryCatch = require('../utils/tryCatch');

// Create
exports.createInterview = tryCatch(async (req, res) => {
  const interview = await Interview.create(req.body);

  // sync with student
  await Student.findByIdAndUpdate(interview.student, { $addToSet: { interviews: interview._id } });

  await Audit.create({ action: 'create', entity: 'Interview', entityId: interview._id, user: req.user?._id, after: interview });
  return sendResponse({ res, status: 201, data: interview, message: 'Interview created and synced with Student' });
});

// Get all
exports.getInterviews = tryCatch(async (req, res) => {
  const interviews = await Interview.find().notDeleted().populate('student client').lean();
  return sendResponse({ res, data: interviews });
});

// Get single
exports.getInterviewById = tryCatch(async (req, res) => {
  const interview = await Interview.findById(req.params.id).notDeleted().populate('student client').lean();
  if (!interview) return sendResponse({ res, status: 404, success: false, message: 'Interview not found' });
  return sendResponse({ res, data: interview });
});

// Update
exports.updateInterview = tryCatch(async (req, res) => {
  const updated = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Interview not found' });

  // If student changed, re-sync
  if (req.body.student) {
    await Student.updateMany({ interviews: updated._id }, { $pull: { interviews: updated._id } });
    await Student.findByIdAndUpdate(updated.student, { $addToSet: { interviews: updated._id } });
  }

  return sendResponse({ res, data: updated, message: 'Interview updated and synced' });
});

// Soft delete
exports.softDeleteInterview = tryCatch(async (req, res) => {
  const updated = await Interview.findByIdAndUpdate(
    req.params.id,
    { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id },
    { new: true }
  ).lean();

  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Interview not found' });

  await Student.findByIdAndUpdate(updated.student, { $pull: { interviews: updated._id } });

  return sendResponse({ res, data: updated, message: 'Interview soft-deleted and unsynced from Student' });
});

// Restore
exports.restoreInterview = tryCatch(async (req, res) => {
  const updated = await Interview.findByIdAndUpdate(
    req.params.id,
    { deleted: false, deletedAt: null, deletedBy: null },
    { new: true }
  ).lean();

  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Interview not found' });

  await Student.findByIdAndUpdate(updated.student, { $addToSet: { interviews: updated._id } });

  return sendResponse({ res, data: updated, message: 'Interview restored and re-synced with Student' });
});

// Hard delete
exports.hardDeleteInterview = tryCatch(async (req, res) => {
  const deleted = await Interview.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return sendResponse({ res, status: 404, success: false, message: 'Interview not found' });

  await Student.findByIdAndUpdate(deleted.student, { $pull: { interviews: deleted._id } });

  return sendResponse({ res, message: 'Interview permanently deleted and unsynced from Student' });
});


// Bulk Create
exports.bulkCreateInterviews = tryCatch(async (req, res) => {
  const interviews = await Interview.insertMany(req.body, { ordered: false });

  // sync with students
  for (const interview of interviews) {
    await Student.findByIdAndUpdate(interview.student, { $addToSet: { interviews: interview._id } });
  }

  return sendResponse({ res, status: 201, data: interviews, message: 'Bulk interviews created and synced' });
});

// Bulk Soft Delete
exports.bulkSoftDeleteInterviews = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const updated = await Interview.updateMany(
    { _id: { $in: ids } },
    { $set: { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id } }
  );

  // unsync from students
  await Student.updateMany({}, { $pull: { interviews: { $in: ids } } });

  return sendResponse({ res, data: updated, message: 'Bulk interviews soft-deleted and unsynced' });
});

// Bulk Restore
exports.bulkRestoreInterviews = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const updated = await Interview.updateMany(
    { _id: { $in: ids } },
    { $set: { deleted: false, deletedAt: null, deletedBy: null } }
  );

  // re-sync with students
  const interviews = await Interview.find({ _id: { $in: ids } });
  for (const interview of interviews) {
    await Student.findByIdAndUpdate(interview.student, { $addToSet: { interviews: interview._id } });
  }

  return sendResponse({ res, data: updated, message: 'Bulk interviews restored and synced' });
});

// Bulk Hard Delete
exports.bulkHardDeleteInterviews = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const deleted = await Interview.find({ _id: { $in: ids } });

  await Interview.deleteMany({ _id: { $in: ids } });
  await Student.updateMany({}, { $pull: { interviews: { $in: ids } } });

  return sendResponse({ res, data: deleted, message: 'Bulk interviews permanently deleted and unsynced' });
});
