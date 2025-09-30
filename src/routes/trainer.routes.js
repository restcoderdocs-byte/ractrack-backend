const express = require("express");
const router = express.Router();
const trainerController = require("../controllers/trainer.controller");

// Single CRUD
router.post("/", trainerController.createTrainer);
router.get("/", trainerController.getTrainers);
router.get("/:id", trainerController.getTrainerById);
router.put("/:id", trainerController.updateTrainer);
router.patch("/soft-delete/:id", trainerController.softDeleteTrainer);
router.patch("/restore/:id", trainerController.restoreTrainer);
router.delete("/:id", trainerController.hardDeleteTrainer);

// Bulk Operations
router.post("/bulk-insert", trainerController.bulkInsertTrainers);
router.patch("/bulk-soft-delete", trainerController.bulkSoftDeleteTrainers);
router.patch("/bulk-restore", trainerController.bulkRestoreTrainers);
router.delete("/bulk-hard-delete", trainerController.bulkHardDeleteTrainers);

module.exports = router;
