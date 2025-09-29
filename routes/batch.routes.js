const express = require("express");
const router = express.Router();
const batchController = require("../controllers/batch.controller");

router.post("/", batchController.createBatch);
router.get("/", batchController.getBatches);
router.get("/:id", batchController.getBatchById);
router.put("/:id", batchController.updateBatch);
router.patch("/soft-delete/:id", batchController.softDeleteBatch);
router.patch("/restore/:id", batchController.restoreBatch);
router.delete("/:id", batchController.hardDeleteBatch);

module.exports = router;
