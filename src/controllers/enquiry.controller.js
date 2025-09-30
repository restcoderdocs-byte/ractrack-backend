// src/controllers/enquiry.controller.js
const Enquiry = require('../models/enquiry.model');
const Student = require('../models/student.model');
const Audit = require('../models/audit.model');
const { sendResponse } = require('../utils/sendResponse');
const tryCatch = require('../utils/tryCatch');

// Create
exports.createEnquiry = tryCatch(async (req, res) => {
  const enquiry = await Enquiry.create(req.body);

  // sync with student
  await Student.findByIdAndUpdate(enquiry.student, { $addToSet: { enquiries: enquiry._id } });

  await Audit.create({ action: 'create', entity: 'Enquiry', entityId: enquiry._id, user: req.user?._id, after: enquiry });
  return sendResponse({ res, status: 201, data: enquiry, message: 'Enquiry created and synced with Student' });
});

// Get all
exports.getEnquiries = tryCatch(async (req, res) => {
  const enquiries = await Enquiry.find().notDeleted().populate('student course').lean();
  return sendResponse({ res, data: enquiries });
});

// Get single
exports.getEnquiryById = tryCatch(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).notDeleted().populate('student course').lean();
  if (!enquiry) return sendResponse({ res, status: 404, success: false, message: 'Enquiry not found' });
  return sendResponse({ res, data: enquiry });
});

// Update
exports.updateEnquiry = tryCatch(async (req, res) => {
  const updated = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Enquiry not found' });

  // If student changed, re-sync
  if (req.body.student) {
    await Student.updateMany({ enquiries: updated._id }, { $pull: { enquiries: updated._id } });
    await Student.findByIdAndUpdate(updated.student, { $addToSet: { enquiries: updated._id } });
  }

  return sendResponse({ res, data: updated, message: 'Enquiry updated and synced' });
});

// Soft delete
exports.softDeleteEnquiry = tryCatch(async (req, res) => {
  const updated = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id },
    { new: true }
  ).lean();

  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Enquiry not found' });

  // sync: remove from student.enquiries
  await Student.findByIdAndUpdate(updated.student, { $pull: { enquiries: updated._id } });

  return sendResponse({ res, data: updated, message: 'Enquiry soft-deleted and unsynced from Student' });
});

// Restore
exports.restoreEnquiry = tryCatch(async (req, res) => {
  const updated = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { deleted: false, deletedAt: null, deletedBy: null },
    { new: true }
  ).lean();

  if (!updated) return sendResponse({ res, status: 404, success: false, message: 'Enquiry not found' });

  // sync back
  await Student.findByIdAndUpdate(updated.student, { $addToSet: { enquiries: updated._id } });

  return sendResponse({ res, data: updated, message: 'Enquiry restored and re-synced with Student' });
});

// Hard delete
exports.hardDeleteEnquiry = tryCatch(async (req, res) => {
  const deleted = await Enquiry.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return sendResponse({ res, status: 404, success: false, message: 'Enquiry not found' });

  // remove permanently from student.enquiries
  await Student.findByIdAndUpdate(deleted.student, { $pull: { enquiries: deleted._id } });

  return sendResponse({ res, message: 'Enquiry permanently deleted and unsynced from Student' });
});


// Bulk Create
exports.bulkCreateEnquiries = tryCatch(async (req, res) => {
  const enquiries = await Enquiry.insertMany(req.body, { ordered: false });

  // sync all with students
  for (const enquiry of enquiries) {
    await Student.findByIdAndUpdate(enquiry.student, { $addToSet: { enquiries: enquiry._id } });
  }

  return sendResponse({ res, status: 201, data: enquiries, message: 'Bulk enquiries created and synced' });
});

// Bulk Soft Delete
exports.bulkSoftDeleteEnquiries = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const updated = await Enquiry.updateMany(
    { _id: { $in: ids } },
    { $set: { deleted: true, deletedAt: new Date(), deletedBy: req.user?._id } }
  );

  // unsync from students
  await Student.updateMany({}, { $pull: { enquiries: { $in: ids } } });

  return sendResponse({ res, data: updated, message: 'Bulk enquiries soft-deleted and unsynced' });
});

// Bulk Restore
exports.bulkRestoreEnquiries = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const updated = await Enquiry.updateMany(
    { _id: { $in: ids } },
    { $set: { deleted: false, deletedAt: null, deletedBy: null } }
  );

  // re-sync with students
  const enquiries = await Enquiry.find({ _id: { $in: ids } });
  for (const enquiry of enquiries) {
    await Student.findByIdAndUpdate(enquiry.student, { $addToSet: { enquiries: enquiry._id } });
  }

  return sendResponse({ res, data: updated, message: 'Bulk enquiries restored and synced' });
});

// Bulk Hard Delete
exports.bulkHardDeleteEnquiries = tryCatch(async (req, res) => {
  const { ids } = req.body;
  const deleted = await Enquiry.find({ _id: { $in: ids } });

  await Enquiry.deleteMany({ _id: { $in: ids } });
  await Student.updateMany({}, { $pull: { enquiries: { $in: ids } } });

  return sendResponse({ res, data: deleted, message: 'Bulk enquiries permanently deleted and unsynced' });
});
