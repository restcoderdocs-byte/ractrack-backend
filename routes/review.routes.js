const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

router.post("/", reviewController.createReview);
router.get("/", reviewController.getReviews);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.patch("/soft-delete/:id", reviewController.softDeleteReview);
router.patch("/restore/:id", reviewController.restoreReview);
router.delete("/:id", reviewController.hardDeleteReview);

module.exports = router;


//! Bulk Operations
// router.post("/bulk-insert", reviewController.bulkInsertReviews);
// router.patch("/bulk-soft-delete", reviewController.bulkSoftDeleteReviews);
// router.patch("/bulk-restore", reviewController.bulkRestoreReviews);