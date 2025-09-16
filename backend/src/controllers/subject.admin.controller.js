const subjectAdminService = require('../../services/subject.admin.service');

const getAllSubjects = async (req, res) => {
    try {
        const subjects = await subjectAdminService.getAll(req.query); // Pass query for filtering
        res.json(subjects);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const createSubject = async (req, res) => {
    try {
        const subject = await subjectAdminService.create(req.body);
        res.status(201).json(subject);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const subject = await subjectAdminService.update(req.params.id, req.body);
        res.json(subject);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        await subjectAdminService.deleteById(req.params.id);
        res.json({ message: 'Subject deleted successfully.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

module.exports = {
    getAllSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
};
