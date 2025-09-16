const express = require('express');
const router = express.Router();
const noticeAdminController = require('../../controllers/notice.admin.controller');
const { protect, isAdmin } = require('../../middleware/authMiddleware');

router.get('/', protect, isAdmin, noticeAdminController.getAllNotices);
router.post('/', protect, isAdmin, noticeAdminController.createNotice);
router.put('/:id', protect, isAdmin, noticeAdminController.updateNotice);
router.delete('/:id', protect, isAdmin, noticeAdminController.deleteNotice);

module.exports = router;
