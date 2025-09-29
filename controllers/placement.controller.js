const mongoose = require("mongoose");
const Placement = require("../models/placement.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Placement
exports.createPlacement = async (req, res, next) => {
  try {
    const { photo, name, designation, companyImage } = req.body;

    if (!photo || !name || !designation || !companyImage) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const placement = await Placement.create({ photo, name, designation, companyImage });
    return res.status(201).json({ success: true, data: placement });
  } catch (error) {
    next(error);
  }
};

// Get All Placements (optimized with aggregation + pagination)
exports.getPlacements = async (req, res, next) => {
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

    const placements = await Placement.aggregate(pipeline).exec();

    return res.status(200).json({ success: true, data: placements });
  } catch (error) {
    next(error);
  }
};

// Get Single Placement
exports.getPlacementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid placement ID" });
    }

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const placement = await Placement.findOne(filter).lean();

    if (!placement) {
      return res.status(404).json({ success: false, message: "Placement not found" });
    }

    return res.status(200).json({ success: true, data: placement });
  } catch (error) {
    next(error);
  }
};

// Update Placement
exports.updatePlacement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid placement ID" });
    }

    const updated = await Placement.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Placement not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeletePlacement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid placement ID" });
    }

    const deleted = await Placement.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Placement not found" });
    }

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restorePlacement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid placement ID" });
    }

    const restored = await Placement.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) {
      return res.status(404).json({ success: false, message: "Placement not found" });
    }

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeletePlacement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid placement ID" });
    }

    const removed = await Placement.findByIdAndDelete(id).lean();

    if (!removed) {
      return res.status(404).json({ success: false, message: "Placement not found" });
    }

    return res.status(200).json({ success: true, message: "Placement permanently deleted" });
  } catch (error) {
    next(error);
  }
};












/* ---------------- BULK OPERATIONS ---------------- */

//! Bulk Insert
// exports.bulkInsertPlacements = async (req, res, next) => {
//   try {
//     const { placements } = req.body;

//     if (!Array.isArray(placements) || placements.length === 0) {
//       return res.status(400).json({ success: false, message: "Placements array is required" });
//     }

//     // Validate before inserting
//     for (let p of placements) {
//       if (!p.photo || !p.name || !p.designation || !p.companyImage) {
//         return res.status(400).json({ success: false, message: "All fields are required for each placement" });
//       }
//     }

//     const inserted = await Placement.insertMany(placements, { ordered: false });
//     return res.status(201).json({ success: true, count: inserted.length, data: inserted });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Soft Delete
// exports.bulkSoftDeletePlacements = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Placement.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: true, deletedAt: new Date() } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} placements soft deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Restore
// exports.bulkRestorePlacements = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Placement.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: false, deletedAt: null } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} placements restored`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Hard Delete
// exports.bulkHardDeletePlacements = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Placement.deleteMany({ _id: { $in: validIds } });

//     return res.status(200).json({
//       success: true,
//       message: `${result.deletedCount} placements permanently deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
