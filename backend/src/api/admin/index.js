const express = require('express');
const router = express.Router();

const subjectAdminRoutes = require('./subject.admin.routes');
const noticeAdminRoutes = require('./notice.admin.routes');
// We will add other admin routes here later

router.use('/subjects', subjectAdminRoutes);
router.use('/notices', noticeAdminRoutes);

module.exports = router;
