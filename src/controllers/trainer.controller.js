const mongoose = require("mongoose");
const Trainer = require("../models/trainer.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------------- SINGLE CRUD ---------------- */

// Create Trainer
exports.createTrainer = async (req, res, next) => {
  try {
    const { name, photo, designation, description } = req.body;
    if (!name || !photo || !designation || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const trainer = await Trainer.create({ name, photo, designation, description });
    return res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

// Get All Trainers (aggregation + pagination)
exports.getTrainers = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) matchStage.isDeleted = false;

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const trainers = await Trainer.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, data: trainers });
  } catch (error) {
    next(error);
  }
};

// Get Single Trainer
exports.getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid trainer ID" });

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const trainer = await Trainer.findOne(filter).lean();
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

    return res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

// Update Trainer
exports.updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid trainer ID" });

    const updated = await Trainer.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Trainer not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid trainer ID" });

    const deleted = await Trainer.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) return res.status(404).json({ success: false, message: "Trainer not found" });

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restoreTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid trainer ID" });

    const restored = await Trainer.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) return res.status(404).json({ success: false, message: "Trainer not found" });

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid trainer ID" });

    const removed = await Trainer.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ success: false, message: "Trainer not found" });

    return res.status(200).json({ success: true, message: "Trainer permanently deleted" });
  } catch (error) {
    next(error);
  }
};

/* ---------------- BULK OPERATIONS ---------------- */

// Bulk Insert
exports.bulkInsertTrainers = async (req, res, next) => {
  try {
    const { trainers } = req.body;
    if (!Array.isArray(trainers) || trainers.length === 0)
      return res.status(400).json({ success: false, message: "Trainers array is required" });

    for (let t of trainers) {
      if (!t.name || !t.photo || !t.designation || !t.description)
        return res.status(400).json({ success: false, message: "All fields are required for each trainer" });
    }

    const inserted = await Trainer.insertMany(trainers, { ordered: false });
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    next(error);
  }
};

// Bulk Soft Delete
exports.bulkSoftDeleteTrainers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Trainer.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} trainers soft deleted` });
  } catch (error) {
    next(error);
  }
};

// Bulk Restore
exports.bulkRestoreTrainers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Trainer.updateMany(
      { _id: { $in: validIds } },
      { $set: { isDeleted: false, deletedAt: null } }
    );

    return res.status(200).json({ success: true, message: `${result.modifiedCount} trainers restored` });
  } catch (error) {
    next(error);
  }
};

// Bulk Hard Delete
exports.bulkHardDeleteTrainers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Trainer.deleteMany({ _id: { $in: validIds } });
    return res.status(200).json({ success: true, message: `${result.deletedCount} trainers permanently deleted` });
  } catch (error) {
    next(error);
  }
};
