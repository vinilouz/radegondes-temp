const StudyPlan = require('../models/StudyPlan');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const TopicProgress = require('../models/TopicProgress');
const StudyLog = require('../models/StudyLog');

const getAllForUser = async (userId) => {
  const plans = await StudyPlan.find({ user: userId }).sort({ position: 1, createdAt: -1 });
  // TODO: Add statistics aggregation logic here
  // For each plan, calculate completion percentage, total study time, etc.
  // by querying the TopicProgress collection.
  return plans;
};

const create = async (userId, planData) => {
  const { name, description, subjectIds } = planData;

  const newPlan = await StudyPlan.create({
    name,
    description,
    user: userId,
    subjects: subjectIds || [],
  });

  // If subjects are added during creation, create their progress trackers
  if (subjectIds && subjectIds.length > 0) {
    const topics = await Topic.find({ subject: { $in: subjectIds } }).select('_id');
    if (topics.length > 0) {
        const progressDocs = topics.map(topic => ({
            user: userId,
            studyPlan: newPlan._id,
            topic: topic._id,
            status: 'Not Started',
        }));
        await TopicProgress.insertMany(progressDocs);
    }
  }

  return newPlan;
};

const getById = async (planId, userId) => {
    const plan = await StudyPlan.findOne({ _id: planId, user: userId })
        .populate('subjects', 'name color'); // Populate subjects with name and color

    if (!plan) {
        const error = new Error('Study plan not found.');
        error.statusCode = 404;
        throw error;
    }

    // TODO: Add detailed statistics for the plan
    // e.g., get all TopicProgress for this plan and aggregate the data.

    return plan;
};

const update = async (planId, userId, updateData) => {
    const { name, description } = updateData;
    const plan = await StudyPlan.findOneAndUpdate(
        { _id: planId, user: userId },
        { name, description },
        { new: true }
    );
    if (!plan) {
        const error = new Error('Study plan not found.');
        error.statusCode = 404;
        throw error;
    }
    return plan;
};

const deleteById = async (planId, userId) => {
    const plan = await StudyPlan.findOne({ _id: planId, user: userId });
    if (!plan) {
        const error = new Error('Study plan not found.');
        error.statusCode = 404;
        throw error;
    }

    // Perform cascade delete
    await TopicProgress.deleteMany({ studyPlan: planId, user: userId });
    await StudyLog.deleteMany({ studyPlan: planId, user: userId });
    // Note: We might also want to delete Review records if that model is kept.

    await plan.deleteOne();
};

const reorder = async (userId, planOrder) => {
    if (!planOrder || !Array.isArray(planOrder)) {
        const error = new Error('Invalid plan order data.');
        error.statusCode = 400;
        throw error;
    }
    const promises = planOrder.map(p =>
        StudyPlan.updateOne({ _id: p.id, user: userId }, { position: p.position })
    );
    await Promise.all(promises);
};


module.exports = {
  getAllForUser,
  create,
  getById,
  update,
  deleteById,
  reorder,
};
