const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Helper to generate JWT
const generateToken = (id, email, role, firstName) => {
  return jwt.sign({ id, email, role, firstName }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

const register = async (userData) => {
  const { firstName, email, password } = userData;

  if (!firstName || !email || !password) {
    const error = new Error('First name, email, and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('Email already registered.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create(userData);
  const token = generateToken(user._id, user.email, user.role, user.firstName);

  // Return only the necessary data
  const userResponse = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  };

  return { user: userResponse, token };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id, user.email, user.role, user.firstName);

  const userResponse = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  };

  return { user: userResponse, token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Incorrect current password.');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();
};

const uploadUserAvatar = async (userId, file) => {
    if (!file) {
        const error = new Error('No file was uploaded.');
        error.statusCode = 400;
        throw error;
    }

    const fileUrl = `/uploads/avatars/${file.filename}`;
    await User.findByIdAndUpdate(userId, { avatar: fileUrl });
    return { url: fileUrl };
};

const deleteUserAvatar = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.avatar) {
        const error = new Error('Avatar not found.');
        error.statusCode = 404;
        throw error;
    }

    const filePath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    await User.findByIdAndUpdate(userId, { avatar: null });
};


// --- Admin Services ---

const getAll = async () => {
    return await User.find().select('-password').sort({ createdAt: -1 });
};

const createByAdmin = async (userData) => {
    const user = await User.create(userData);
    return await User.findById(user._id).select('-password');
};

const getByIdAdmin = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const updateByAdmin = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    }).select('-password');

    if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const deleteByAdmin = async (userId) => {
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }
};


module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  uploadUserAvatar,
  deleteUserAvatar,
  getAll,
  createByAdmin,
  getByIdAdmin,
  updateByAdmin,
  deleteByAdmin,
};
