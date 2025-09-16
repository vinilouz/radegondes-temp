const Category = require('../models/Category');

const getAll = async () => {
  return await Category.find().sort({ name: 1 });
};

const getAllAdmin = async () => {
    return await Category.find().sort({ createdAt: -1 });
};

const create = async (categoryData) => {
  const { name } = categoryData;
  if (!name) {
    const error = new Error('Name is required.');
    error.statusCode = 400;
    throw error;
  }
  return await Category.create({ name });
};

const update = async (id, categoryData) => {
  const { name } = categoryData;
  if (!name) {
    const error = new Error('Name is required.');
    error.statusCode = 400;
    throw error;
  }
  const category = await Category.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

const deleteById = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  getAll,
  getAllAdmin,
  create,
  update,
  deleteById,
};
