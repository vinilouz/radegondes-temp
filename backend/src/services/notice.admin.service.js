const Notice = require('../../models/Notice');

const getAll = async () => {
    return await Notice.find().sort({ createdAt: -1 });
};

const create = async (data) => {
    const { name } = data;
    if (!name) {
        const error = new Error('Name is required.');
        error.statusCode = 400;
        throw error;
    }
    return await Notice.create({ name });
};

const update = async (id, data) => {
    const { name } = data;
    if (!name) {
        const error = new Error('Name is required.');
        error.statusCode = 400;
        throw error;
    }
    const notice = await Notice.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
    if (!notice) {
        const error = new Error('Notice not found.');
        error.statusCode = 404;
        throw error;
    }
    return notice;
};

const deleteById = async (id) => {
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
        const error = new Error('Notice not found.');
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
