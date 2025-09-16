const express = require('express');
const router = express.Router();
const subjectAdminController = require('../../controllers/subject.admin.controller');
const { protect, isAdmin } = require('../../middleware/authMiddleware');

router.get('/', protect, isAdmin, subjectAdminController.getAllSubjects);
router.post('/', protect, isAdmin, subjectAdminController.createSubject);
router.put('/:id', protect, isAdmin, subjectAdminController.updateSubject);
router.delete('/:id', protect, isAdmin, subjectAdminController.deleteSubject);

module.exports = router;
