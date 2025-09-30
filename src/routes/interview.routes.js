// src/routes/interview.routes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const requireAuth = require('../middlewares/requireAuth');

router.post('/', requireAuth, interviewController.createInterview);
router.get('/', requireAuth, interviewController.getInterviews);
router.get('/:id', requireAuth, interviewController.getInterviewById);
router.put('/:id', requireAuth, interviewController.updateInterview);
router.delete('/:id/soft', requireAuth, interviewController.softDeleteInterview);
router.patch('/:id/restore', requireAuth, interviewController.restoreInterview);
router.delete('/:id/hard', requireAuth, interviewController.hardDeleteInterview);

// ✅ Bulk operations
router.post('/bulk', requireAuth, interviewController.bulkCreateInterviews);
router.delete('/bulk/soft', requireAuth, interviewController.bulkSoftDeleteInterviews);
router.patch('/bulk/restore', requireAuth, interviewController.bulkRestoreInterviews);
router.delete('/bulk/hard', requireAuth, interviewController.bulkHardDeleteInterviews);

module.exports = router;
