const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// @route   GET api/categories
// @desc    Get all categories for regular users
// @access  Private
router.get('/', protect, categoryController.getAllCategories);

// --- Admin Routes ---

// @route   GET api/categories/admin
// @desc    Get all categories for admin panel
// @access  Private/Admin
router.get('/admin', protect, isAdmin, categoryController.getAllCategoriesAdmin);

// @route   POST api/categories/admin
// @desc    Create a category
// @access  Private/Admin
router.post('/admin', protect, isAdmin, categoryController.createCategory);

// @route   PUT api/categories/admin/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/admin/:id', protect, isAdmin, categoryController.updateCategory);

// @route   DELETE api/categories/admin/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/admin/:id', protect, isAdmin, categoryController.deleteCategory);

module.exports = router;
