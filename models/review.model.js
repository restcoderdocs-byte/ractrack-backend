const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    photo: { type: String, required: true }, // image URL or path
    name: { type: String, required: true },
    branch: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ rating: -1, branch: 1 }); // optimization for queries

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
