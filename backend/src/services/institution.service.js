const Institution = require('../models/Institution');
const Subject = require('../models/Subject');

const getAll = async () => {
    const institutions = await Institution.find().populate('category', 'name').sort({ name: 1 });

    // This filtering logic is complex and might need to be optimized,
    // but for now, I'll replicate the original functionality.
    const filteredInstitutions = await Promise.all(
      institutions.map(async (institution) => {
        if (!institution.positions || institution.positions.length === 0) {
          return null; // No positions/notices
        }

        const positionsWithSubjects = [];
        for (const position of institution.positions) {
          const subjectCount = await Subject.countDocuments({ notice: position });
          if (subjectCount > 0) {
            positionsWithSubjects.push(position);
          }
        }

        if (positionsWithSubjects.length === 0) {
          return null;
        }

        const institutionObj = institution.toObject();
        institutionObj.positions = positionsWithSubjects;
        return institutionObj;
      })
    );

    return filteredInstitutions.filter(inst => inst !== null);
};

const getAllAdmin = async () => {
    return await Institution.find().populate('category', 'name').sort({ createdAt: -1 });
};

const create = async (data) => {
    return await Institution.create(data);
};

const update = async (id, data) => {
    const institution = await Institution.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('category', 'name');
    if (!institution) {
        const error = new Error('Institution not found.');
        error.statusCode = 404;
        throw error;
    }
    return institution;
};

const deleteById = async (id) => {
    const institution = await Institution.findByIdAndDelete(id);
    if (!institution) {
        const error = new Error('Institution not found.');
        error.statusCode = 404;
        throw error;
    }
};

const uploadLogo = (file) => {
    if (!file) {
        const error = new Error('No file was uploaded.');
        error.statusCode = 400;
        throw error;
    }
    const fileUrl = `/uploads/logotipos/${file.filename}`;
    return { url: fileUrl };
};

module.exports = {
  getAll,
  getAllAdmin,
  create,
  update,
  deleteById,
  uploadLogo,
};
