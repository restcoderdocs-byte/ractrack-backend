const mongoose = require("mongoose");
const Review = require("../models/review.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Review
exports.createReview = async (req, res, next) => {
  try {
    const { photo, name, branch, rating, review } = req.body;

    if (!photo || !name || !branch || !rating || !review) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newReview = await Review.create({ photo, name, branch, rating, review });
    return res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    next(error);
  }
};

// Get All Reviews (optimized with aggregation + pagination)
exports.getReviews = async (req, res, next) => {
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

    const reviews = await Review.aggregate(pipeline).exec();

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// Get Single Review
exports.getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const review = await Review.findOne(filter).lean();

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Update Review
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const updated = await Review.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete Review
exports.softDeleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const deleted = await Review.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore Review
exports.restoreReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const restored = await Review.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete Review
exports.hardDeleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const removed = await Review.findByIdAndDelete(id).lean();

    if (!removed) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    return res.status(200).json({ success: true, message: "Review permanently deleted" });
  } catch (error) {
    next(error);
  }
};











/* ---------------- BULK OPERATIONS ---------------- */

//! Bulk Insert
// exports.bulkInsertReviews = async (req, res, next) => {
//   try {
//     const { reviews } = req.body;

//     if (!Array.isArray(reviews) || reviews.length === 0) {
//       return res.status(400).json({ success: false, message: "Reviews array is required" });
//     }

//     // validate fields before insert
//     for (let r of reviews) {
//       if (!r.photo || !r.name || !r.branch || !r.rating || !r.review) {
//         return res.status(400).json({ success: false, message: "All fields are required for each review" });
//       }
//     }

//     const inserted = await Review.insertMany(reviews, { ordered: false });
//     return res.status(201).json({ success: true, count: inserted.length, data: inserted });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Soft Delete
// exports.bulkSoftDeleteReviews = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Review.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: true, deletedAt: new Date() } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} reviews soft deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//! Bulk Restore
// exports.bulkRestoreReviews = async (req, res, next) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ success: false, message: "Array of IDs is required" });
//     }

//     const validIds = ids.filter((id) => isValidObjectId(id));
//     if (validIds.length === 0) {
//       return res.status(400).json({ success: false, message: "No valid IDs provided" });
//     }

//     const result = await Review.updateMany(
//       { _id: { $in: validIds } },
//       { $set: { isDeleted: false, deletedAt: null } }
//     );

//     return res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} reviews restored`,
//     });
//   } catch (error) {
//     next(error);
//   }
// };