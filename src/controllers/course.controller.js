const mongoose = require("mongoose");
const Course = require("../models/course.model");

// Utility for ObjectId validation
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------------- SINGLE CRUD ---------------- */

// Create Course
exports.createCourse = async (req, res, next) => {
  try {
    const { name, targetAudience, frontend, backend } = req.body;

    if (!name || !targetAudience || !frontend || !backend) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const course = await Course.create({ name, targetAudience, frontend, backend });
    return res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// Get All Courses (aggregation + pagination)
exports.getCourses = async (req, res, next) => {
  try {
    let { limit = 10, after, includeDeleted = false } = req.query;
    limit = parseInt(limit);

    const matchStage = {};
    if (!JSON.parse(includeDeleted)) matchStage.isDeleted = false;

    const pipeline = [{ $match: matchStage }, { $sort: { _id: 1 } }, { $limit: limit }];

    if (after && isValidObjectId(after)) {
      pipeline.unshift({ $match: { ...matchStage, _id: { $gt: new mongoose.Types.ObjectId(after) } } });
    }

    const courses = await Course.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

// Get Single Course
exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;

    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid course ID" });

    const filter = { _id: id };
    if (!JSON.parse(includeDeleted)) filter.isDeleted = false;

    const course = await Course.findOne(filter).lean();
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// Update Course
exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid course ID" });

    const updated = await Course.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// Soft Delete
exports.softDeleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid course ID" });

    const deleted = await Course.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!deleted) return res.status(404).json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    next(error);
  }
};

// Restore
exports.restoreCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid course ID" });

    const restored = await Course.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).lean();

    if (!restored) return res.status(404).json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, data: restored });
  } catch (error) {
    next(error);
  }
};

// Hard Delete
exports.hardDeleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid course ID" });

    const removed = await Course.findByIdAndDelete(id).lean();
    if (!removed) return res.status(404).json({ success: false, message: "Course not found" });

    return res.status(200).json({ success: true, message: "Course permanently deleted" });
  } catch (error) {
    next(error);
  }
};

/* ---------------- BULK OPERATIONS ---------------- */

// Bulk Insert
exports.bulkInsertCourses = async (req, res, next) => {
  try {
    const { courses } = req.body;
    if (!Array.isArray(courses) || courses.length === 0)
      return res.status(400).json({ success: false, message: "Courses array is required" });

    for (let c of courses) {
      if (!c.name || !c.targetAudience || !c.frontend || !c.backend) {
        return res.status(400).json({ success: false, message: "All fields are required for each course" });
      }
    }

    const inserted = await Course.insertMany(courses, { ordered: false });
    return res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (error) {
    next(error);
  }
};

// Bulk Soft Delete
exports.bulkSoftDeleteCourses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Course.updateMany({ _id: { $in: validIds } }, { $set: { isDeleted: true, deletedAt: new Date() } });
    return res.status(200).json({ success: true, message: `${result.modifiedCount} courses soft deleted` });
  } catch (error) {
    next(error);
  }
};

// Bulk Restore
exports.bulkRestoreCourses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Course.updateMany({ _id: { $in: validIds } }, { $set: { isDeleted: false, deletedAt: null } });
    return res.status(200).json({ success: true, message: `${result.modifiedCount} courses restored` });
  } catch (error) {
    next(error);
  }
};

// Bulk Hard Delete
exports.bulkHardDeleteCourses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: "Array of IDs is required" });

    const validIds = ids.filter((id) => isValidObjectId(id));
    if (validIds.length === 0) return res.status(400).json({ success: false, message: "No valid IDs provided" });

    const result = await Course.deleteMany({ _id: { $in: validIds } });
    return res.status(200).json({ success: true, message: `${result.deletedCount} courses permanently deleted` });
  } catch (error) {
    next(error);
  }
};
