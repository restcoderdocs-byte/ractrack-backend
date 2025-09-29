const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    yop: { type: Number, required: true },
    stream: { type: String, required: true },
    interestedCourse: { type: String, required: true },
    college: { type: String, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for faster lookups
enquirySchema.index({ name: 1, email: 1, contact: 1 });

const Enquiry = mongoose.model("Enquiry", enquirySchema);
module.exports = Enquiry;
