const Student = require("../models/student.model");
const isValidObjectId = require("../utils/isValidObjectId");

// ---------------- Add Student ----------------
const addStudent = async (req, res, next) => {
  try {
    const { name, email, phone, course, fees, feesPaid, numberOfInterviews } = req.body;

    const existing = await Student.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.email === email
            ? `Email '${email}' is already registered`
            : `Phone '${phone}' is already registered`,
      });
    }

    const student = await Student.create({ name, email, phone, course, fees, feesPaid, numberOfInterviews });
    res.status(201).json({ success: true, message: "Student added successfully", data: student });
  } catch (error) {
    next(error);
  }
};

// ---------------- Get All Students (Search & Filters) ----------------
const getStudents = async (req, res, next) => {
  try {
    let { 
      limit = 10, 
      page = 1, 
      includeDeleted = false, 
      search = "", 
      course, 
      minFees, 
      maxFees, 
      sortBy = "createdAt", 
      sortOrder = "desc" 
    } = req.query;

    limit = Math.min(parseInt(limit), 100);
    page = parseInt(page);

    const match = { 
      ...(includeDeleted !== "true" && { isDeleted: false }),
      ...(course && { course }),
      ...(minFees && { fees: { $gte: parseFloat(minFees) } }),
      ...(maxFees && { fees: { $lte: parseFloat(maxFees) } }),
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const sortOption = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const studentsAggregate = Student.aggregate([
      { $match: match },
      { $sort: sortOption },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { 
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          course: 1,
          fees: 1,
          feesPaid: 1,
          numberOfInterviews: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      },
    ]);

    const totalPromise = Student.countDocuments(match);
    const [students, total] = await Promise.all([studentsAggregate.exec(), totalPromise]);

    res.status(200).json({ success: true, total, page, limit, data: students });
  } catch (error) {
    next(error);
  }
};

// ---------------- Get Student by ID ----------------
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) 
      return res.status(400).json({ success: false, message: "Invalid student ID" });

    const filter = { _id: id };
    if (includeDeleted !== "true") filter.isDeleted = false;

    const student = await Student.findOne(filter).lean();
    if (!student) 
      return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};


// ---------------- Update Student ----------------
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, course, fees, feesPaid, numberOfInterviews } = req.body;

    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    if (email || phone) {
      const duplicate = await Student.findOne({ _id: { $ne: id }, $or: [{ email }, { phone }] }).lean();
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message:
            duplicate.email === email
              ? `Email '${email}' is already registered`
              : `Phone '${phone}' is already registered`,
        });
      }
    }

    const student = await Student.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { name, email, phone, course, fees, feesPaid, numberOfInterviews },
      { new: true, runValidators: true }
    ).lean();

    if (!student) return res.status(404).json({ success: false, message: "Student not found or deleted" });

    res.status(200).json({ success: true, message: "Student updated successfully", data: student });
  } catch (error) {
    next(error);
  }
};

// ---------------- Soft Delete Student ----------------
const softDeleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    const student = await Student.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true }).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found or already deleted" });

    res.status(200).json({ success: true, message: "Student soft deleted successfully", data: student });
  } catch (error) {
    next(error);
  }
};

// ---------------- Restore Student ----------------
const restoreStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    const student = await Student.findOneAndUpdate({ _id: id, isDeleted: true }, { isDeleted: false }, { new: true }).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found or not deleted" });

    res.status(200).json({ success: true, message: "Student restored successfully", data: student });
  } catch (error) {
    next(error);
  }
};

// ---------------- Hard Delete Student ----------------
const hardDeleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });

    const student = await Student.findByIdAndDelete(id).lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    res.status(200).json({ success: true, message: "Student permanently deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
  restoreStudent,
  hardDeleteStudent,
};
