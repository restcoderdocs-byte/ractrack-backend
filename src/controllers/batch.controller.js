const mongoose = require("mongoose");
const Batch = require("../models/batch.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Batch
let createBatch = async (req, res, next) => {
  try {
    const { date, day, time, duration, mode, trainer, contact } = req.body;

    if (!date || !day || !time || !duration || !mode || !trainer || !contact) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const batch = await Batch.create({ date, day, time, duration, mode, trainer, contact });
    return res.status(201).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// Get All Batches (optimized with aggregation + pagination)
let getBatches = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) {
      matchStage.isDeleted = false;
    }

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const batches = await Batch.aggregate(pipeline).exec();

    return res.status(200).json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};

// Get Single Batch
let getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid batch ID" });
    }

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const batch = await Batch.findOne(filter).lean();

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

// Update Batch
let updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid batch ID" });
    }

    const updated = await Batch.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
let softDeleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid batch ID" });
    }

    const deleted = await Batch.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
let restoreBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid batch ID" });
    }

    const restored = await Batch.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
let hardDeleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid batch ID" });
    }

    const removed = await Batch.findByIdAndDelete(id).lean();

    if (!removed) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({ success: true, message: "Batch permanently deleted" });
  } catch (error) {
    next(error);
  }
};


module.exports={
    createBatch,
    getBatches,
    getBatchById,
    updateBatch,
    softDeleteBatch ,
    restoreBatch ,
    hardDeleteBatch 
}