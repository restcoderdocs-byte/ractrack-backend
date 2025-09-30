// src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { createStudentValidator } = require('../validators/student.validator');

// Example: requireAuth middleware (optional)
const requireAuth = require('../middlewares/requireAuth');

// CRUD
router.post('/', requireAuth, studentController.createStudent);
router.get('/', requireAuth, studentController.getStudents);
router.get('/:id', requireAuth, studentController.getStudentById);
router.put('/:id', requireAuth, studentController.updateStudent);

// Delete / Restore
router.delete('/:id/soft', requireAuth, studentController.softDeleteStudent);
router.patch('/:id/restore', requireAuth, studentController.restoreStudent);
router.delete('/:id/hard', requireAuth, studentController.hardDeleteStudent);

// Bulk ops
router.post('/bulk/soft-delete', requireAuth, studentController.bulkSoftDelete);
router.post('/bulk/restore', requireAuth, studentController.bulkRestore);
router.post('/bulk/hard-delete', requireAuth, studentController.bulkHardDelete);
// in student.routes.js

router.post('/', requireAuth, createStudentValidator, studentController.createStudent);

module.exports = router;
