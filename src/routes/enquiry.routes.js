// src/routes/enquiry.routes.js
const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const requireAuth = require('../middlewares/requireAuth');

router.post('/', requireAuth, enquiryController.createEnquiry);
router.get('/', requireAuth, enquiryController.getEnquiries);
router.get('/:id', requireAuth, enquiryController.getEnquiryById);
router.put('/:id', requireAuth, enquiryController.updateEnquiry);
router.delete('/:id/soft', requireAuth, enquiryController.softDeleteEnquiry);
router.patch('/:id/restore', requireAuth, enquiryController.restoreEnquiry);
router.delete('/:id/hard', requireAuth, enquiryController.hardDeleteEnquiry);

// ✅ Bulk operations
router.post('/bulk', requireAuth, enquiryController.bulkCreateEnquiries);
router.delete('/bulk/soft', requireAuth, enquiryController.bulkSoftDeleteEnquiries);
router.patch('/bulk/restore', requireAuth, enquiryController.bulkRestoreEnquiries);
router.delete('/bulk/hard', requireAuth, enquiryController.bulkHardDeleteEnquiries);

module.exports = router;
