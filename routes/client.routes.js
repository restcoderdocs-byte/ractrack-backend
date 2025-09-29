const express = require("express");
const router = express.Router();
const clientController = require("../controllers/client.controller");

router.post("/", clientController.createClient);
router.get("/", clientController.getClients);
router.get("/:id", clientController.getClientById);
router.put("/:id", clientController.updateClient);
router.patch("/soft-delete/:id", clientController.softDeleteClient);
router.patch("/restore/:id", clientController.restoreClient);
router.delete("/:id", clientController.hardDeleteClient);

module.exports = router;
