const categoryService = require('../services/category.service');

const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAll();
        res.json(categories);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await categoryService.getAllAdmin();
        res.json(categories);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await categoryService.update(req.params.id, req.body);
        res.json(category);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await categoryService.deleteById(req.params.id);
        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

module.exports = {
    getAllCategories,
    getAllCategoriesAdmin,
    createCategory,
    updateCategory,
    deleteCategory,
};
