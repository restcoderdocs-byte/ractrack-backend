const mongoose = require("mongoose");
const Interview = require("../models/interview.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------------- SINGLE CRUD ---------------- */

// Create Interview
exports.createInterview = async (req, res, next) => {
  try {
    const { companyName, status, announcedDate, scheduledDate } = req.body;

    if (!companyName || !status || !announcedDate || !scheduledDate) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const interview = await Interview.create({ companyName, status, announcedDate, scheduledDate });
    return res.status(201).json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// Get All Interviews (aggregation + pagination)
exports.getInterviews = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) matchStage.isDeleted = false;

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const interviews = await Interview.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, data: interviews });
  } catch (error) {
    next(error);
  }
};

// Get Single Interview
exports.getInterviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid interview ID" });

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const interview = await Interview.findOne(filter).lean();
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found" });

    return res.status(200).json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

// Update Interview
exports.updateInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid interview ID" });

    const updated = await Interview.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Interview not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeleteInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid interview ID" });

    const deleted = await Interview.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) return res.status(404).json({ success: false, message: "Interview not found" });

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restoreInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid interview ID" });

    const restored = await Interview.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) return res.status(404).json({ success: false, message: "Interview not found" });

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeleteInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid interview ID" });

    const removed = await Interview.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ success: false, message: "Interview not found" });

    return res.status(200).json({ success: true, message: "Interview permanently deleted" });
  } catch (error) {
    next(error);
  }
};

/* ---------------- BULK OPERATIONS ---------------- */

// Bulk Insert
exports.bulkInsertInterviews = async (req, res, next) => {
  try {
    const { interviews } = req.body;
    if (!Array.isArray(interviews) || interviews.length === 0)
      return res.status(400).json({ success: false, message: "Interviews array is required" });

    for (let i of interviews) {
      if (!i.companyName || !i.status || !i.announcedDate || !i.scheduledDate)
        return res.status(400).json({ success: false, message: "All fields are required for each interview" });
    }

    const inserted = await Interview.insertMany(interviews, { ordered: false });
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    next(error);
  }
};

// Bulk Soft Delete
exports.bulkSoftDeleteInterviews = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Interview.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} interviews soft deleted` });
  } catch (error) {
    next(error);
  }
};

// Bulk Restore
exports.bulkRestoreInterviews = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Interview.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: false, deletedAt: null } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} interviews restored` });
  } catch (error) {
    next(error);
  }
};

// Bulk Hard Delete
exports.bulkHardDeleteInterviews = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Interview.deleteMany({ _id: { $in: validIds } });
    return res.status(200).json({ success: true, message: `${result.deletedCount} interviews permanently deleted` });
  } catch (error) {
    next(error);
  }
};
