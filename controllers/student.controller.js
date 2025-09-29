const Student = require("../models/student.model");
const isValidObjectId = require("../utils/isValidObjectId");
const mongoose = require('mongoose');
const { Types } = mongoose;

// Utility: validate ObjectId
function isObjectId(id) {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === String(id);
}

// ---------------- Add Student ----------------
const addStudent = async (req, res, next) => {
try {
const { name, email, phone, course, fees, feesPaid, numberOfInterviews } = req.body;


if (!name || !email || !phone) {
return res.status(400).json({ success: false, message: "Name, email, and phone are required" });
}


// Check for duplicates (email or phone)
const existing = await Student.findOne({ $or: [{ email }, { phone }] }).lean();
if (existing) {
return res.status(409).json({ success: false, message: "Email or phone already exists" });
}


const student = new Student({
name,
email,
phone,
course,
fees,
feesPaid,
numberOfInterviews,
});


await student.save();
res.status(201).json({ success: true, message: "Student added", data: student.toObject() });
} catch (error) {
next(error);
}
};
// ---------------- Get All Students (Search & Filters) ----------------
// Refactored getStudents controller (industry standard, optimized for large datasets)
// Improvements over old version:
// - Uses aggregation for single-round trip queries.
// - Keyset pagination support (cursor-based) in addition to page/limit.
// - Avoids regex on multiple fields for performance: uses text index when search is provided.
// - Caps limit to avoid excessive payload.
// - Runs countDocuments only if explicitly requested (to avoid heavy extra query).
// - Safe projection, no over-fetching.




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
      sortOrder = "desc",
      lastId, // for cursor-based pagination
      withCount = false // optional: include total count only when needed
    } = req.query;

    limit = Math.min(parseInt(limit, 10) || 10, 100);
    page = parseInt(page, 10) || 1;

    const match = {
      ...(includeDeleted !== "true" && { isDeleted: false }),
      ...(course && { course }),
      ...(minFees && { fees: { $gte: parseFloat(minFees) } }),
      ...(maxFees && { fees: { $lte: parseFloat(maxFees) } }),
    };

    // Use text index if available, fallback to regex
    if (search) {
      if (Student.schema.indexes().some(i => Object.keys(i[0]).includes('$**') || Object.keys(i[0]).includes('name'))) {
        match.$text = { $search: search };
      } else {
        match.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }
    }

    const sortOption = { [sortBy]: sortOrder === "asc" ? 1 : -1, _id: sortOrder === "asc" ? 1 : -1 };

    // Build aggregation pipeline
    const pipeline = [{ $match: match }];

    // Cursor-based pagination
    if (lastId && isObjectId(lastId)) {
      const pivotDoc = await Student.findById(lastId).select(sortBy).lean();
      if (pivotDoc) {
        const pivotValue = pivotDoc[sortBy];
        if (sortOption[sortBy] === -1) {
          pipeline.push({
            $match: {
              $or: [
                { [sortBy]: { $lt: pivotValue } },
                { $and: [{ [sortBy]: pivotValue }, { _id: { $lt: Types.ObjectId(lastId) } }] }
              ]
            }
          });
        } else {
          pipeline.push({
            $match: {
              $or: [
                { [sortBy]: { $gt: pivotValue } },
                { $and: [{ [sortBy]: pivotValue }, { _id: { $gt: Types.ObjectId(lastId) } }] }
              ]
            }
          });
        }
      }
    } else {
      // Offset pagination fallback
      pipeline.push({ $skip: (page - 1) * limit });
    }

    pipeline.push({ $sort: sortOption });
    pipeline.push({ $limit: limit + 1 }); // fetch one extra for hasNext

    pipeline.push({
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
    });

    // Execute aggregation
    const docs = await Student.aggregate(pipeline).allowDiskUse(true).exec();

    let hasNext = false;
    let results = docs;
    if (docs.length > limit) {
      hasNext = true;
      results = docs.slice(0, limit);
    }

    // Count only when explicitly asked (avoid heavy extra query)
    let total = null;
    if (withCount === 'true' || withCount === true) {
      total = await Student.countDocuments(match);
    }

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      hasNext,
      nextCursor: hasNext ? String(results[results.length - 1]._id) : null,
      data: results
    });
  } catch (error) {
    next(error);
  }
};


// ---------------- Get Student by ID ----------------
const getSingleStudent = async (req, res, next) => {
try {
const { id } = req.params;
const { includeDeleted = false } = req.query;


if (!isObjectId(id)) {
return res.status(400).json({ success: false, message: "Invalid student ID" });
}


const match = { _id: Types.ObjectId(id) };
if (includeDeleted !== "true") match.isDeleted = false;


const student = await Student.findOne(match)
.select("name email phone course fees feesPaid numberOfInterviews isDeleted createdAt updatedAt")
.lean();


if (!student) {
return res.status(404).json({ success: false, message: "Student not found" });
}


res.status(200).json({ success: true, data: student });
} catch (error) {
next(error);
}
};


// ---------------- Update Student ----------------
const updateStudent = async (req, res, next) => {
try {
const { id } = req.params;
if (!isObjectId(id)) {
return res.status(400).json({ success: false, message: "Invalid student ID" });
}


const updates = req.body;
if (!updates || Object.keys(updates).length === 0) {
return res.status(400).json({ success: false, message: "No update data provided" });
}


// Prevent updating restricted fields
const restricted = ["_id", "createdAt", "updatedAt"];
restricted.forEach(f => delete updates[f]);


// Check for duplicate email/phone if they are being updated
if (updates.email || updates.phone) {
const duplicate = await Student.findOne({
_id: { $ne: id },
$or: [
updates.email ? { email: updates.email } : {},
updates.phone ? { phone: updates.phone } : {},
],
}).lean();


if (duplicate) {
return res.status(409).json({ success: false, message: "Email or phone already exists" });
}
}


const student = await Student.findByIdAndUpdate(
id,
{ $set: updates },
{ new: true, runValidators: true }
).lean();


if (!student) {
return res.status(404).json({ success: false, message: "Student not found" });
}


res.status(200).json({ success: true, message: "Student updated", data: student });
} catch (error) {
next(error);
}
};




// ---------------- Soft Delete Student ----------------
const softDeleteStudent = async (req, res, next) => {
try {
const { id } = req.params;
if (!isObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });


const student = await Student.findByIdAndUpdate(
id,
{ isDeleted: true, deletedAt: new Date() },
{ new: true }
).lean();


if (!student) return res.status(404).json({ success: false, message: "Student not found" });


res.status(200).json({ success: true, message: "Student soft deleted", data: student });
} catch (error) {
next(error);
}
};


// ---------------- Restore Student ----------------
const restoreStudent = async (req, res, next) => {
try {
const { id } = req.params;
if (!isObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });


const student = await Student.findByIdAndUpdate(
id,
{ isDeleted: false, deletedAt: null },
{ new: true }
).lean();


if (!student) return res.status(404).json({ success: false, message: "Student not found" });


res.status(200).json({ success: true, message: "Student restored", data: student });
} catch (error) {
next(error);
}
};

// ---------------- Hard Delete Student ----------------
const hardDeleteStudent = async (req, res, next) => {
try {
const { id } = req.params;
if (!isObjectId(id)) return res.status(400).json({ success: false, message: "Invalid student ID" });


const student = await Student.findByIdAndDelete(id).lean();


if (!student) return res.status(404).json({ success: false, message: "Student not found" });


res.status(200).json({ success: true, message: "Student permanently deleted" });
} catch (error) {
next(error);
}
};


//! bulk operations


// ---------------------- BULK SOFT DELETE ----------------------
const bulkSoftDelete = async (req, res, next) => {
try {
const { ids } = req.body;
if (!Array.isArray(ids) || !ids.every(isObjectId)) {
return res.status(400).json({ success: false, message: "Invalid student IDs" });
}


const ops = ids.map(id => ({
updateOne: {
filter: { _id: Types.ObjectId(id) },
update: { $set: { isDeleted: true, deletedAt: new Date() } }
}
}));


await Student.bulkWrite(ops);
res.status(200).json({ success: true, message: "Students soft deleted" });
} catch (error) {
next(error);
}
};


// ---------------------- BULK RESTORE ----------------------
const bulkRestore = async (req, res, next) => {
try {
const { ids } = req.body;
if (!Array.isArray(ids) || !ids.every(isObjectId)) {
return res.status(400).json({ success: false, message: "Invalid student IDs" });
}


const ops = ids.map(id => ({
updateOne: {
filter: { _id: Types.ObjectId(id) },
update: { $set: { isDeleted: false, deletedAt: null } }
}
}));


await Student.bulkWrite(ops);
res.status(200).json({ success: true, message: "Students restored" });
} catch (error) {
next(error);
}
};


// ---------------------- BULK HARD DELETE ----------------------
const bulkHardDelete = async (req, res, next) => {
try {
const { ids } = req.body;
if (!Array.isArray(ids) || !ids.every(isObjectId)) {
return res.status(400).json({ success: false, message: "Invalid student IDs" });
}


const ops = ids.map(id => ({
deleteOne: { filter: { _id: Types.ObjectId(id) } }
}));


await Student.bulkWrite(ops);
res.status(200).json({ success: true, message: "Students permanently deleted" });
} catch (error) {
next(error);
}
};


//! bulk operation

module.exports = {
  addStudent,
  getStudents,
  getSingleStudent,
  updateStudent,
  softDeleteStudent,
  restoreStudent,
  hardDeleteStudent,
};












//! Reminder
// audit log system