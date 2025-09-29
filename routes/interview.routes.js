const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interview.controller");

// Single CRUD
router.post("/", interviewController.createInterview);
router.get("/", interviewController.getInterviews);
router.get("/:id", interviewController.getInterviewById);
router.put("/:id", interviewController.updateInterview);
router.patch("/soft-delete/:id", interviewController.softDeleteInterview);
router.patch("/restore/:id", interviewController.restoreInterview);
router.delete("/:id", interviewController.hardDeleteInterview);

// Bulk Operations
router.post("/bulk-insert", interviewController.bulkInsertInterviews);
router.patch("/bulk-soft-delete", interviewController.bulkSoftDeleteInterviews);
router.patch("/bulk-restore", interviewController.bulkRestoreInterviews);
router.delete("/bulk-hard-delete", interviewController.bulkHardDeleteInterviews);

module.exports = router;
