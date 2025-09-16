const noticeAdminService = require('../../services/notice.admin.service');

const getAllNotices = async (req, res) => {
    try {
        const notices = await noticeAdminService.getAll();
        res.json(notices);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const createNotice = async (req, res) => {
    try {
        const notice = await noticeAdminService.create(req.body);
        res.status(201).json(notice);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const updateNotice = async (req, res) => {
    try {
        const notice = await noticeAdminService.update(req.params.id, req.body);
        res.json(notice);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

const deleteNotice = async (req, res) => {
    try {
        await noticeAdminService.deleteById(req.params.id);
        res.json({ message: 'Notice deleted successfully.' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
    }
};

module.exports = {
    getAllNotices,
    createNotice,
    updateNotice,
    deleteNotice,
};
