const Subject = require('../../models/Subject');
const mongoose = require('mongoose');

const getAll = async (filter) => {
    return await Subject.find(filter).populate('institution', 'name acronym').sort({ createdAt: -1 });
};

const create = async (data) => {
    const { name, color, institution, notice } = data;
    const subjectData = {
        name,
        color: color || 'blue',
        notice,
    };
    if (institution && mongoose.Types.ObjectId.isValid(institution)) {
        subjectData.institution = institution;
    }
    return await Subject.create(subjectData);
};

const update = async (id, data) => {
    const { name, color, institution, notice } = data;
    const updateData = { name, color, institution, notice };
    const subject = await Subject.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!subject) {
        const error = new Error('Subject not found.');
        error.statusCode = 404;
        throw error;
    }
    return subject;
};

const deleteById = async (id) => {
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
        const error = new Error('Subject not found.');
        error.statusCode = 404;
        throw error;
    }
};

module.exports = {
  getAll,
  create,
  update,
  deleteById,
};
