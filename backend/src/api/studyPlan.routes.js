const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlan.controller');
const { protect } = require('../middleware/authMiddleware');

// Get all study plans for the logged-in user
router.get('/', protect, studyPlanController.getAllStudyPlans);

// Reorder study plans
router.put('/reorder', protect, studyPlanController.reorderStudyPlans);

// Create a new study plan
router.post('/', protect, studyPlanController.createStudyPlan);

// Get a specific study plan by ID
router.get('/:id', protect, studyPlanController.getStudyPlanById);

// Update a specific study plan (e.g., name, description)
router.put('/:id', protect, studyPlanController.updateStudyPlan);

// Delete a specific study plan
router.delete('/:id', protect, studyPlanController.deleteStudyPlan);

// --- Subject management within a Study Plan ---

// Add a subject to a study plan
router.post('/:studyPlanId/subjects', protect, studyPlanController.addSubjectToPlan);

// Update a subject's details within the context of a study plan (if needed)
// This might be for plan-specific metadata in the future.
router.put('/:studyPlanId/subjects/:subjectId', protect, studyPlanController.updateSubjectInPlan);

// Remove a subject from a study plan
router.delete('/:studyPlanId/subjects/:subjectId', protect, studyPlanController.removeSubjectFromPlan);

module.exports = router;
