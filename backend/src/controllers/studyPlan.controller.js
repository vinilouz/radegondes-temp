const studyPlanService = require('../services/studyPlan.service');

const getAllStudyPlans = async (req, res) => {
  try {
    const studyPlans = await studyPlanService.getAllForUser(req.user.id);
    res.json(studyPlans);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const createStudyPlan = async (req, res) => {
  try {
    const newPlan = await studyPlanService.create(req.user.id, req.body);
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const getStudyPlanById = async (req, res) => {
  try {
    const plan = await studyPlanService.getById(req.params.id, req.user.id);
    res.json(plan);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const updateStudyPlan = async (req, res) => {
  try {
    const plan = await studyPlanService.update(req.params.id, req.user.id, req.body);
    res.json(plan);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const deleteStudyPlan = async (req, res) => {
  try {
    await studyPlanService.deleteById(req.params.id, req.user.id);
    res.json({ message: 'Study plan deleted successfully.' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};

const reorderStudyPlans = async (req, res) => {
  try {
    await studyPlanService.reorder(req.user.id, req.body.plans);
    res.json({ message: 'Order updated successfully.' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  }
};


// --- Placeholder functions for subject management ---
// These would also call service methods in a full implementation.

const addSubjectToPlan = async (req, res) => {
  // Example:
  // try {
  //   const { studyPlanId } = req.params;
  //   const { subjectId } = req.body;
  //   const updatedPlan = await studyPlanService.addSubject(studyPlanId, subjectId, req.user.id);
  //   res.json(updatedPlan);
  // } catch (error) {
  //   res.status(error.statusCode || 500).json({ message: error.message || 'Server error' });
  // }
  res.status(501).json({ message: 'Not implemented yet' });
};

const updateSubjectInPlan = async (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

const removeSubjectFromPlan = async (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
};


module.exports = {
  getAllStudyPlans,
  createStudyPlan,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  reorderStudyPlans,
  addSubjectToPlan,
  updateSubjectInPlan,
  removeSubjectFromPlan,
};
