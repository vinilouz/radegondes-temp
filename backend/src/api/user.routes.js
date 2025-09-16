const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Private routes for the logged-in user
router.get('/profile', protect, userController.getCurrentUserProfile);
router.put('/profile', protect, userController.updateCurrentUserProfile);
router.put('/profile/preferences', protect, userController.updateCurrentUserPreferences);
router.put('/profile/password', protect, userController.updateCurrentUserPassword);
router.post('/profile/avatar', protect, upload.single('avatar'), userController.uploadAvatar);
router.delete('/profile/avatar', protect, userController.deleteAvatar);

// For getting other users' public profiles if needed in the future
router.get('/:id', protect, userController.getUserById);

// --- Admin Routes ---
// All routes from here require admin privileges

router.get('/', protect, isAdmin, userController.getAllUsers);
router.post('/', protect, isAdmin, userController.createUserByAdmin);

router.get('/:id/admin', protect, isAdmin, userController.getUserByIdAdmin);
router.put('/:id/admin', protect, isAdmin, userController.updateUserByAdmin);
router.delete('/:id/admin', protect, isAdmin, userController.deleteUserByAdmin);

module.exports = router;
