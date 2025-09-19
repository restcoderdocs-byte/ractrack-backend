const router = require("express").Router();
const studentCtrl = require("../controllers/student.controller");

// CRUD + soft delete + restore
router.post("/", studentCtrl.addStudent);
router.get("/", studentCtrl.getStudents);
router.get("/:id", studentCtrl.getStudentById);
router.put("/:id", studentCtrl.updateStudent);
router.patch("/:id/soft-delete", studentCtrl.softDeleteStudent);
router.patch("/:id/restore", studentCtrl.restoreStudent);
router.delete("/:id", studentCtrl.hardDeleteStudent);

module.exports = router;
