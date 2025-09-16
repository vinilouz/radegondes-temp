const institutionService = require('../services/institution.service');

const getAllInstitutions = async (req, res) => {
    try {
        const institutions = await institutionService.getAll();
        res.json(institutions);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const getAllInstitutionsAdmin = async (req, res) => {
    try {
        const institutions = await institutionService.getAllAdmin();
        res.json(institutions);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const createInstitution = async (req, res) => {
    try {
        const institution = await institutionService.create(req.body);
        res.status(201).json(institution);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const updateInstitution = async (req, res) => {
    try {
        const institution = await institutionService.update(req.params.id, req.body);
        res.json(institution);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const deleteInstitution = async (req, res) => {
    try {
        await institutionService.deleteById(req.params.id);
        res.json({ message: 'Institution deleted successfully.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const uploadLogo = (req, res) => {
    try {
        const result = institutionService.uploadLogo(req.file);
        res.json({
            message: 'Logo uploaded successfully!',
            url: result.url
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

module.exports = {
    getAllInstitutions,
    getAllInstitutionsAdmin,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    uploadLogo,
};
