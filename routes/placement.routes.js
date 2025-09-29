const express = require("express");
const router = express.Router();
const placementController = require("../controllers/placement.controller");

router.post("/", placementController.createPlacement);
router.get("/", placementController.getPlacements);
router.get("/:id", placementController.getPlacementById);
router.put("/:id", placementController.updatePlacement);
router.patch("/soft-delete/:id", placementController.softDeletePlacement);
router.patch("/restore/:id", placementController.restorePlacement);
router.delete("/:id", placementController.hardDeletePlacement);

module.exports = router;


//! Bulk Operations
// router.post("/bulk-insert", placementController.bulkInsertPlacements);
// router.patch("/bulk-soft-delete", placementController.bulkSoftDeletePlacements);
// router.patch("/bulk-restore", placementController.bulkRestorePlacements);
// router.delete("/bulk-hard-delete", placementController.bulkHardDeletePlacements);