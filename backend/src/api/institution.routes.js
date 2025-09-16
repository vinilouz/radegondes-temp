const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// @route   GET api/institutions
// @desc    Get all institutions (filtered for users)
// @access  Private
router.get('/', protect, institutionController.getAllInstitutions);

// --- Admin Routes ---

// @route   GET api/institutions/admin
// @desc    Get all institutions for admin panel
// @access  Private/Admin
router.get('/admin', protect, isAdmin, institutionController.getAllInstitutionsAdmin);

// @route   POST api/institutions/admin
// @desc    Create an institution
// @access  Private/Admin
router.post('/admin', protect, isAdmin, institutionController.createInstitution);

// @route   PUT api/institutions/admin/:id
// @desc    Update an institution
// @access  Private/Admin
router.put('/admin/:id', protect, isAdmin, institutionController.updateInstitution);

// @route   DELETE api/institutions/admin/:id
// @desc    Delete an institution
// @access  Private/Admin
router.delete('/admin/:id', protect, isAdmin, institutionController.deleteInstitution);

// @route   POST api/institutions/admin/upload-logo
// @desc    Upload a logo for an institution
// @access  Private/Admin
router.post('/admin/upload-logo', protect, isAdmin, upload.single('logotipo'), institutionController.uploadLogo);

module.exports = router;
