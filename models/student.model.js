const mongoose = require("mongoose");

// ----------------- Student Schema -----------------
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,10})+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    course: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    fees: {
      type: Number,
      required: [true, "Total fees is required"],
      min: [0, "Fees cannot be negative"],
    },
    feesPaid: {
      type: Number,
      default: 0,
      min: [0, "Fees paid cannot be negative"],
      validate: {
        validator: function (v) {
          return v <= this.fees;
        },
        message: "Fees paid cannot exceed total fees",
      },
    },
    numberOfInterviews: {
      type: Number,
      default: 0,
      min: [0, "Number of interviews cannot be negative"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // index for faster queries
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ----------------- Indexes -----------------
// Compound index for email + phone uniqueness (optional, extra safety)
studentSchema.index({ email: 1, phone: 1 }, { unique: true });

// ----------------- Model -----------------
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
