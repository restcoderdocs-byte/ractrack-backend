const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    photo: { type: String, required: true }, // client logo or image
    name: { type: String, required: true },  // client name

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for optimized lookups
clientSchema.index({ name: 1 });

const Client = mongoose.model("Client", clientSchema);
module.exports = Client;
