const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const studyPlanRoutes = require('./studyPlan.routes');
const categoryRoutes = require('./category.routes');

router.use('/users', userRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/categories', categoryRoutes);

const institutionRoutes = require('./institution.routes');
const adminRoutes = require('./admin'); // Import the main admin router

router.use('/institutions', institutionRoutes);
router.use('/admin', adminRoutes); // Use the admin router with /admin prefix

module.exports = router;
