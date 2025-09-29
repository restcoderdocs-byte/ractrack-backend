const mongoose = require("mongoose");
const Enquiry = require("../models/enquiry.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------------- SINGLE CRUD ---------------- */

// Create Enquiry
exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, contact, email, yop, stream, interestedCourse, college } = req.body;

    if (!name || !contact || !email || !yop || !stream || !interestedCourse || !college) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const enquiry = await Enquiry.create({ name, contact, email, yop, stream, interestedCourse, college });
    return res.status(201).json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
};

// Get All Enquiries (aggregation + pagination)
exports.getEnquiries = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) matchStage.isDeleted = false;

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const enquiries = await Enquiry.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    next(error);
  }
};

// Get Single Enquiry
exports.getEnquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid enquiry ID" });

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const enquiry = await Enquiry.findOne(filter).lean();
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });

    return res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
};

// Update Enquiry
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid enquiry ID" });

    const updated = await Enquiry.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Enquiry not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid enquiry ID" });

    const deleted = await Enquiry.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) return res.status(404).json({ success: false, message: "Enquiry not found" });

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restoreEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid enquiry ID" });

    const restored = await Enquiry.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) return res.status(404).json({ success: false, message: "Enquiry not found" });

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid enquiry ID" });

    const removed = await Enquiry.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ success: false, message: "Enquiry not found" });

    return res.status(200).json({ success: true, message: "Enquiry permanently deleted" });
  } catch (error) {
    next(error);
  }
};

/* ---------------- BULK OPERATIONS ---------------- */

// Bulk Insert
exports.bulkInsertEnquiries = async (req, res, next) => {
  try {
    const { enquiries } = req.body;
    if (!Array.isArray(enquiries) || enquiries.length === 0)
      return res.status(400).json({ success: false, message: "Enquiries array is required" });

    for (let e of enquiries) {
      if (!e.name || !e.contact || !e.email || !e.yop || !e.stream || !e.interestedCourse || !e.college)
        return res.status(400).json({ success: false, message: "All fields are required for each enquiry" });
    }

    const inserted = await Enquiry.insertMany(enquiries, { ordered: false });
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    next(error);
  }
};

// Bulk Soft Delete
exports.bulkSoftDeleteEnquiries = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Enquiry.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} enquiries soft deleted` });
  } catch (error) {
    next(error);
  }
};

// Bulk Restore
exports.bulkRestoreEnquiries = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Enquiry.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: false, deletedAt: null } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} enquiries restored` });
  } catch (error) {
    next(error);
  }
};

// Bulk Hard Delete
exports.bulkHardDeleteEnquiries = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Enquiry.deleteMany({ _id: { $in: validIds } });
    return res.status(200).json({ success: true, message: `${result.deletedCount} enquiries permanently deleted` });
  } catch (error) {
    next(error);
  }
};
