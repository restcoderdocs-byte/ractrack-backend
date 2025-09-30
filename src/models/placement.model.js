const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    photo: { type: String, required: true },        // candidate photo
    name: { type: String, required: true },         // candidate name
    designation: { type: String, required: true },  // role/designation
    companyImage: { type: String, required: true }, // company logo or image

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for optimized lookups
placementSchema.index({ name: 1, designation: 1 });

const Placement = mongoose.model("Placement", placementSchema);
module.exports = Placement;
