const userService = require('../services/user.service');

const registerUser = async (req, res) => {
  try {
    const { user, token } = await userService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully!',
      user,
      token,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await userService.login(email, password);
    res.json({
      message: 'Login successful!',
      user,
      token,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateCurrentUserProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateCurrentUserPreferences = async (req, res) => {
    try {
        // In a real app, you might have a separate service for preferences
        const { studyDays, availablePeriods, firstDayOfWeek, alertSound } = req.body;
        await userService.updateProfile(req.user.id, { studyDays, availablePeriods, firstDayOfWeek, alertSound });
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const updateCurrentUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.updatePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getProfile(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const result = await userService.uploadUserAvatar(req.user.id, req.file);
        res.json({
            message: 'Avatar uploaded successfully!',
            url: result.url
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const deleteAvatar = async (req, res) => {
    try {
        await userService.deleteUserAvatar(req.user.id);
        res.json({ message: 'Avatar deleted successfully!' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

// --- Admin Controllers ---

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const user = await userService.createByAdmin(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getUserByIdAdmin = async (req, res) => {
  try {
    const user = await userService.getByIdAdmin(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const user = await userService.updateByAdmin(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    await userService.deleteByAdmin(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

// This was a dummy endpoint in the original file. It doesn't need a service.
const getDashboardData = (req, res) => {
    res.json({
        message: `Welcome to the Dashboard, ${req.user.email}!`,
    });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateCurrentUserPreferences,
  updateCurrentUserPassword,
  getUserById,
  getAllUsers,
  createUserByAdmin,
  getUserByIdAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  uploadAvatar,
  deleteAvatar,
  getDashboardData,
};
