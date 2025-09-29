const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");

// Single CRUD
router.post("/", courseController.createCourse);
router.get("/", courseController.getCourses);
router.get("/:id", courseController.getCourseById);
router.put("/:id", courseController.updateCourse);
router.patch("/soft-delete/:id", courseController.softDeleteCourse);
router.patch("/restore/:id", courseController.restoreCourse);
router.delete("/:id", courseController.hardDeleteCourse);

// Bulk Operations
router.post("/bulk-insert", courseController.bulkInsertCourses);
router.patch("/bulk-soft-delete", courseController.bulkSoftDeleteCourses);
router.patch("/bulk-restore", courseController.bulkRestoreCourses);
router.delete("/bulk-hard-delete", courseController.bulkHardDeleteCourses);

module.exports = router;
