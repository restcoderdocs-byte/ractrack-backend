const express = require("express");
const router = express.Router();
const enquiryController = require("../controllers/enquiry.controller");

// Single CRUD
router.post("/", enquiryController.createEnquiry);
router.get("/", enquiryController.getEnquiries);
router.get("/:id", enquiryController.getEnquiryById);
router.put("/:id", enquiryController.updateEnquiry);
router.patch("/soft-delete/:id", enquiryController.softDeleteEnquiry);
router.patch("/restore/:id", enquiryController.restoreEnquiry);
router.delete("/:id", enquiryController.hardDeleteEnquiry);

// Bulk Operations
router.post("/bulk-insert", enquiryController.bulkInsertEnquiries);
router.patch("/bulk-soft-delete", enquiryController.bulkSoftDeleteEnquiries);
router.patch("/bulk-restore", enquiryController.bulkRestoreEnquiries);
router.delete("/bulk-hard-delete", enquiryController.bulkHardDeleteEnquiries);

module.exports = router;
